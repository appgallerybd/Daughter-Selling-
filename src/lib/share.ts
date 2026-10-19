import type { AppData } from '../types';

/**
 * ডিভাইস থেকে ডিভাইসে হিসাব নেওয়ার কোড।
 *
 * কোডের ভেতরেই সম্পূর্ণ হিসাব সংকুচিত (deflate) হয়ে থাকে — কোনো সার্ভার বা
 * ডেটাবেস লাগে না। তাই যেকোনো স্ট্যাটিক হোস্টিং (Vercel, Netlify) এ ঠিকঠাক কাজ করে।
 * ফরম্যাট: BIYE1.<z|u><base64url>
 */

const PREFIX = 'BIYE1.';
const DEFLATED = 'z';
const PLAIN = 'u';

const b64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;

    out += b64Alphabet[b0 >> 2];
    out += b64Alphabet[((b0 & 0b11) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += b64Alphabet[((b1 & 0b1111) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += b64Alphabet[b2 & 0b111111];
  }
  return out;
}

function base64UrlToBytes(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9_-]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let length = 0;
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    const value = b64Alphabet.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[length++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, length);
}

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function deflate(text: string): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const source = new Blob([text]).stream();
    const compressed = source.pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(compressed).arrayBuffer());
  } catch {
    return null;
  }
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const source = streamOf(bytes);
  // lib.dom-এর টাইপে DecompressionStream-এর chunk টাইপ কিছুটা অসামঞ্জস্যপূর্ণ
  const inflater = new DecompressionStream('deflate-raw') as unknown as ReadableWritablePair<
    Uint8Array,
    Uint8Array
  >;
  return new Response(source.pipeThrough(inflater)).text();
}

export async function encodeShareCode(data: AppData): Promise<string> {
  const json = JSON.stringify(data);
  const compressed = await deflate(json);
  if (compressed) return PREFIX + DEFLATED + bytesToBase64Url(compressed);
  return PREFIX + PLAIN + bytesToBase64Url(new TextEncoder().encode(json));
}

/** কেউ পুরো লিংক পেস্ট করলেও যেন কোডটা বের করা যায় */
export function extractShareCode(input: string): string {
  const text = input.trim();
  if (!text) return '';

  const marker = text.indexOf(PREFIX);
  if (marker >= 0) {
    return text
      .slice(marker)
      .split(/[\s&#]/)[0]
      .replace(/^["']+|["']+$/g, '');
  }

  // লিংকের ভেতরে ?d= বা #d= আকারে থাকলে
  try {
    const url = new URL(text, window.location.href);
    const fromHash = new URLSearchParams(url.hash.replace(/^#\/?/, '')).get('d');
    if (fromHash) return fromHash;
    const fromQuery = url.searchParams.get('d');
    if (fromQuery) return fromQuery;
  } catch {
    // লিংক না হলে নিচের চেক
  }
  return text.replace(/^["'\s]+|["'\s]+$/g, '');
}

function normalize(raw: unknown): AppData {
  const parsed = raw as AppData;
  if (!parsed || typeof parsed !== 'object') throw new Error('এটা সঠিক শেয়ার কোড নয়');
  if (!parsed.event || !Array.isArray(parsed.contributions) || !Array.isArray(parsed.expenses)) {
    throw new Error('কোডটি অসম্পূর্ণ — আবার কপি করে দিন');
  }
  return {
    version: 1,
    event: parsed.event,
    contributions: parsed.contributions,
    expenses: parsed.expenses,
  };
}

export async function decodeShareCode(input: string): Promise<AppData> {
  const code = extractShareCode(input);
  if (!code.startsWith(PREFIX)) {
    throw new Error('কোডটির শুরুতে BIYE1. থাকা দরকার');
  }

  const mode = code[PREFIX.length];
  const body = code.slice(PREFIX.length + 1);
  if (!body) throw new Error('কোডটি ফাঁকা');

  const bytes = base64UrlToBytes(body);
  let json: string;

  if (mode === DEFLATED) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('এই ব্রাউজারে পুরোনো কোড খোলা যাচ্ছে না — নতুন ব্রাউজার ব্যবহার করুন');
    }
    try {
      json = await inflate(bytes);
    } catch {
      throw new Error('কোডটি পড়া যায়নি — কপি করার সময় কিছু বাদ পড়েছে');
    }
  } else {
    json = new TextDecoder().decode(bytes);
  }

  try {
    return normalize(JSON.parse(json));
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error('কোডটি পড়া যায়নি');
  }
}

export function buildShareLink(code: string): string {
  if (typeof window === 'undefined') return code;
  const url = new URL(window.location.href);
  url.hash = `d=${code}`;
  return url.toString();
}

export function readShareCodeFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('d=')) return hash.slice(2);
  const query = new URLSearchParams(window.location.search).get('d');
  return query || null;
}

export function clearShareLocation(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** মানুষ পড়তে পারে এমন সাইজ (কিলোবাইট) */
export function codeSize(code: string): string {
  const bytes = new TextEncoder().encode(code).length;
  if (bytes < 1024) return `${bytes} অক্ষর`;
  return `${(bytes / 1024).toFixed(1)} কিলোবাইট`;
}
