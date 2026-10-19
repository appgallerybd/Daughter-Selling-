import { Check, Copy, Link2, Share2, Smartphone, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { bnDate, num } from '../lib/format';
import {
  buildShareLink,
  codeSize,
  decodeShareCode,
  encodeShareCode,
  extractShareCode,
} from '../lib/share';
import { useStore } from '../store';
import type { AppData } from '../types';
import { ImportDialog } from './ImportDialog';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // পুরোনো ব্রাউজার/HTTP-তে ক্লিপবোর্ড API থাকে না
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ShareData() {
  const { data, notify } = useStore();
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [generatedAt, setGeneratedAt] = useState<{ contributions: number; expenses: number } | null>(
    null,
  );
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paste, setPaste] = useState('');
  const [preview, setPreview] = useState<AppData | null>(null);

  const generate = async () => {
    setBusy(true);
    setError('');
    setCopied(null);
    try {
      const next = await encodeShareCode(data);
      setCode(next);
      setLink(buildShareLink(next));
      setGeneratedAt({ contributions: data.contributions.length, expenses: data.expenses.length });
    } catch {
      setError('কোড তৈরি করা যায়নি — আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (kind: 'link' | 'code') => {
    const value = kind === 'link' ? link : code;
    if (!value) return;
    const ok = await copyText(value);
    if (ok) {
      setCopied(kind);
      notify(kind === 'link' ? 'লিংক কপি হয়েছে' : 'কোড কপি হয়েছে');
      window.setTimeout(() => setCopied(null), 2200);
    } else {
      notify('কপি করা যায়নি — লেখাটি নিজে সিলেক্ট করে কপি করুন');
    }
  };

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.event.title || 'বিয়ে বাড়ির হিসাব',
          text: 'এই লিংকে ক্লিক করলেই বিয়ে বাড়ির সম্পূর্ণ হিসাব পাবেন',
          url: link,
        });
        return;
      } catch {
        // ব্যবহারকারী বাতিল করলে চুপচাপ থাকি
      }
    }
    await copy('link');
  };

  const verify = async () => {
    if (!paste.trim()) {
      setError('আগে কোডটি পেস্ট করুন');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const decoded = await decodeShareCode(extractShareCode(paste));
      setPreview(decoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কোডটি পড়া যায়নি');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-head">
          <div>
            <h3>ডিভাইস থেকে ডিভাইসে শেয়ার</h3>
            <div className="card-sub">
              এক ফোনের সব হিসাব অন্য ফোনে নিয়ে যান — লিংক পাঠান, ওপাশে এক ক্লিকেই হিসাব চলে যাবে
            </div>
          </div>
          <span className="chip gold">
            <Smartphone size={13} /> কোনো সার্ভার লাগে না
          </span>
        </div>

        <div className="share-steps">
          <section className="share-step">
            <div className="share-step-head">
              <span className="share-step-num">১</span>
              <div>
                <div className="list-title">এই ডিভাইসের হিসাব পাঠান</div>
                <div className="list-sub">
                  {num(data.contributions.length)} টি আদায় ও {num(data.expenses.length)} টি খরচের এন্ট্রি
                  {data.event.bride || data.event.groom
                    ? ` · ${[data.event.bride, data.event.groom].filter(Boolean).join(' ও ')}`
                    : ''}
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-primary" onClick={generate} disabled={busy}>
              <Sparkles size={15} /> {code ? 'নতুন কোড তৈরি করুন' : 'শেয়ার কোড তৈরি করুন'}
            </button>

            {error && !preview ? <div className="form-error" style={{ marginTop: 12 }}>{error}</div> : null}

            {code ? (
              <div className="share-output">
                <div className="share-field">
                  <label htmlFor="share-link">শেয়ার লিংক — এটাই সবচেয়ে সহজ</label>
                  <div className="share-row">
                    <input id="share-link" className="input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
                    <button type="button" className="btn btn-sm" onClick={() => copy('link')}>
                      {copied === 'link' ? <Check size={14} /> : <Link2 size={14} />}
                      {copied === 'link' ? 'কপি হয়েছে' : 'লিংক কপি'}
                    </button>
                  </div>
                </div>

                <div className="share-actions">
                  <button type="button" className="btn btn-sm btn-gold" onClick={share}>
                    <Share2 size={14} /> শেয়ার করুন
                  </button>
                </div>

                <div className="share-field">
                  <label htmlFor="share-code">অথবা শুধু কোডটি কপি করুন</label>
                  <div className="share-row">
                    <textarea
                      id="share-code"
                      className="input share-code"
                      readOnly
                      rows={3}
                      value={code}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                    <button type="button" className="btn btn-sm" onClick={() => copy('code')}>
                      {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
                      {copied === 'code' ? 'কপি হয়েছে' : 'কোড কপি'}
                    </button>
                  </div>
                </div>

                <div className="share-meta">
                  <span>
                    <strong>{num(generatedAt?.contributions ?? data.contributions.length)}</strong> আদায় ·{' '}
                    <strong>{num(generatedAt?.expenses ?? data.expenses.length)}</strong> খরচ ·{' '}
                    {codeSize(code)}
                  </span>
                  <span>কোডটি তৈরি হয়েছে এই মুহূর্তের হিসাব থেকে</span>
                </div>

                <div className="form-error" style={{ background: '#fdf6ee', color: '#8a5f13', marginTop: 14 }}>
                  লিংক ও কোডের ভেতরেই সম্পূর্ণ হিসাব (নাম, ফোন নম্বর, টাকার পরিমাণ) সংকুচিত হয়ে থাকে —
                  তাই এটি শুধু বিশ্বস্ত মানুষকে দিন। কাউকে না দিলে কেউ খুলতে পারবে না।
                </div>
              </div>
            ) : (
              <p className="muted small" style={{ marginTop: 12 }}>
                কোড তৈরি করলে তার ভেতরেই পুরো হিসাব চলে যায়। তাই ৬ অঙ্কের ছোট কোডের মতো সার্ভারে কিছু
                জমা রাখতে হয় না — Vercel-এর ফ্রি স্ট্যাটিক হোস্টিং-এও হুবহু কাজ করে।
              </p>
            )}
          </section>

          <section className="share-step">
            <div className="share-step-head">
              <span className="share-step-num">২</span>
              <div>
                <div className="list-title">অন্য ডিভাইসের কোড নিন</div>
                <div className="list-sub">
                  কেউ লিংক পাঠালে সেটি খুললেই হিসাব চলে আসবে; শুধু কোড পেলে এখানে পেস্ট করুন
                </div>
              </div>
            </div>

            <div className="share-field">
              <label htmlFor="share-paste">শেয়ার কোড বা লিংক</label>
              <textarea
                id="share-paste"
                className="input share-code"
                rows={3}
                placeholder="BIYE1.z... অথবা https://.../#d=BIYE1.z..."
                value={paste}
                onChange={(event) => {
                  setPaste(event.target.value);
                  setError('');
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn-primary" onClick={verify} disabled={busy || !paste.trim()}>
                <Check size={15} /> কোড যাচাই করে নিন
              </button>
              {paste ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setPaste('');
                    setError('');
                  }}
                >
                  মুছে ফেলুন
                </button>
              ) : null}
            </div>

            {error ? <div className="form-error" style={{ marginTop: 12 }}>{error}</div> : null}

            <p className="muted small" style={{ marginTop: 14 }}>
              ডিভাইস বদলানোর আগে সেটিংসের “ব্যাকআপ ডাউনলোড”-ও রাখতে পারেন — ইন্টারনেট ছাড়া ফিরিয়ে
              আনার জন্য।
              {data.event.date ? ` বিয়ের দিন: ${bnDate(data.event.date)}।` : ''}
            </p>
          </section>
        </div>
      </div>

      {preview ? <ImportDialog payload={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}
