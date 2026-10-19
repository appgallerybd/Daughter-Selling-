import { EXPENSE_CATEGORIES, METHODS, RELATIONS, SIDES, labelOf, type AppData } from '../types';
import { bnDate, money } from './format';

function escapeCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  // BOM so Excel opens Bangla text correctly
  return `\uFEFF${lines.join('\r\n')}`;
}

export function download(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function contributionsCsv(data: AppData): string {
  return toCsv(
    ['নাম', 'ফোন', 'পক্ষ', 'সম্পর্ক', 'মাধ্যম', 'প্রাপ্তি (৳)', 'প্রতিশ্রুতি (৳)', 'বাকি (৳)', 'তারিখ', 'নোট'],
    data.contributions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => [
        item.name,
        item.phone,
        labelOf(SIDES, item.side),
        labelOf(RELATIONS, item.relation),
        labelOf(METHODS, item.method),
        item.amount,
        Math.max(item.pledged, item.amount),
        Math.max(0, item.pledged - item.amount),
        bnDate(item.date),
        item.note,
      ]),
  );
}

export function expensesCsv(data: AppData): string {
  return toCsv(
    ['খরচের খাত', 'বিবরণ', 'পরিশোধিত ব্যক্তি/প্রতিষ্ঠান', 'টাকা (৳)', 'তারিখ', 'নোট'],
    data.expenses
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => [
        labelOf(EXPENSE_CATEGORIES, item.category),
        item.title,
        item.paidTo,
        item.amount,
        bnDate(item.date),
        item.note,
      ]),
  );
}

export function summaryText(data: AppData, values: { collected: number; pledged: number; expenses: number; balance: number }): string {
  const lines = [
    `বিয়ে বাড়ির হিসাব — ${data.event.title}`,
    `তারিখ: ${bnDate(data.event.date)} | স্থান: ${data.event.venue || '—'}`,
    '',
    `মোট আদায়: ${money(values.collected)}`,
    `মোট প্রতিশ্রুতি: ${money(values.pledged)}`,
    `বাকি আদায়: ${money(Math.max(0, values.pledged - values.collected))}`,
    `মোট খরচ: ${money(values.expenses)}`,
    `হাতে আছে: ${money(values.balance)}`,
    `মোট অনুদানকারী: ${data.contributions.length} জন`,
  ];
  return lines.join('\n');
}
