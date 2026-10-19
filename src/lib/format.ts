const numberFormat = new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('bn-BD', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat('bn-BD', {
  day: '2-digit',
  month: '2-digit',
});

/** ১২৩৪৫ */
export function num(value: number): string {
  return numberFormat.format(Math.round(value || 0));
}

/** ৳১২,৩৪৫ */
export function money(value: number): string {
  return `৳${num(value)}`;
}

/** বড় সংখ্যা সংক্ষেপে — ৳১.২ লাখ */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `৳${(value / 10000000).toFixed(1)} কোটি`;
  if (abs >= 100000) return `৳${(value / 100000).toFixed(1)} লাখ`;
  if (abs >= 1000) return `৳${(value / 1000).toFixed(1)} হাজার`;
  return money(value);
}

/** ১২ অক্টোবর, ২০২৬ */
export function bnDate(iso: string): string {
  if (!iso) return '—';
  return dateFormat.format(new Date(`${iso}T00:00:00`));
}

export function shortDate(iso: string): string {
  if (!iso) return '—';
  return shortDateFormat.format(new Date(`${iso}T00:00:00`));
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function daysUntil(iso: string): number {
  if (!iso) return 0;
  const target = new Date(`${iso}T00:00:00`).getTime();
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  return Math.round((target - today) / 86400000);
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
