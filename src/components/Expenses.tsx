import { Download, Package, Pencil, PiggyBank, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  EXPENSE_CATEGORIES,
  labelOf,
  type Expense,
  type ExpenseCategory,
} from '../types';
import { bnDate, money, num, percent, todayISO, uid } from '../lib/format';
import { download, expensesCsv } from '../lib/csv';
import { byCategory, totals } from '../lib/selectors';
import { EmptyState, Field, Modal, StatCard } from './ui';

const emptyDraft = (): Expense => ({
  id: '',
  title: '',
  category: 'food',
  amount: 0,
  date: todayISO(),
  paidTo: '',
  note: '',
});

export function Expenses() {
  const { data, saveExpense, removeExpense, notify } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all');
  const [draft, setDraft] = useState<Expense | null>(null);

  const stats = useMemo(() => totals(data), [data]);
  const categories = useMemo(() => byCategory(data.expenses), [data.expenses]);

  const rows = useMemo(() => {
    return data.expenses
      .filter((item) => {
        if (category !== 'all' && item.category !== category) return false;
        if (query.trim()) {
          const needle = query.trim().toLowerCase();
          const haystack = `${item.title} ${item.paidTo} ${item.note}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [category, data.expenses, query]);

  const filteredTotal = rows.reduce((sum, item) => sum + item.amount, 0);

  const handleDelete = (item: Expense) => {
    if (!window.confirm(`“${item.title}” খরচটি মুছে ফেলবেন?`)) return;
    removeExpense(item.id);
    notify('খরচ মুছে ফেলা হয়েছে');
  };

  return (
    <>
      <div className="stat-grid">
        <StatCard
          label="মোট খরচ"
          value={money(stats.expenses)}
          icon={<Receipt size={15} />}
          accent="#bd8626"
          accentSoft="#f6ecd7"
          foot={`${num(data.expenses.length)} টি খরচের এন্ট্রি`}
        />
        <StatCard
          label="বাজেট"
          value={money(stats.budget)}
          icon={<PiggyBank size={15} />}
          accent="#7a1730"
          accentSoft="#f8ebee"
          foot={`ব্যবহার হয়েছে ${num(stats.budgetProgress)}%`}
        />
        <StatCard
          label="বাজেট বাকি"
          value={money(stats.budgetLeft)}
          icon={<PiggyBank size={15} />}
          accent={stats.budgetLeft >= 0 ? '#2f6b4f' : '#b3261e'}
          accentSoft={stats.budgetLeft >= 0 ? '#e8f2eb' : '#fbe9e7'}
          foot={stats.budgetLeft >= 0 ? 'বাজেটের মধ্যে আছেন' : 'বাজেট ছাড়িয়ে গেছে'}
        />
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>খাতভিত্তিক খরচ</h3>
              <div className="card-sub">কোন খাতে কত টাকা গেল</div>
            </div>
            <span className="chip gold">{num(categories.length)} টি খাত</span>
          </div>
          {categories.length ? (
            <div>
              {categories.map((item) => (
                <div className="progress-row" key={item.id}>
                  <div className="progress-top">
                    <span className="dot" style={{ background: item.color }} />
                    <span>{item.label}</span>
                    <span className="muted small">({num(item.count)})</span>
                    <strong>{money(item.value)}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percent(item.value, stats.expenses)}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<PiggyBank size={32} />} title="খরচের তথ্য নেই" note="প্রথম খরচ যোগ করুন।" />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>বাজেট ব্যবহার</h3>
              <div className="card-sub">
                {money(stats.expenses)} / {money(stats.budget)}
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: 12 }}>
            <div
              className="progress-fill"
              style={{
                width: `${stats.budgetProgress}%`,
                background:
                  stats.budgetProgress > 100
                    ? 'linear-gradient(90deg,#d1493f,#b3261e)'
                    : 'linear-gradient(90deg,#e0b25c,#bd8626)',
              }}
            />
          </div>
          <div className="hero-progress-top" style={{ color: 'var(--muted)', marginTop: 8 }}>
            <span>ব্যবহৃত {num(stats.budgetProgress)}%</span>
            <span>বাকি {money(Math.max(0, stats.budgetLeft))}</span>
          </div>
          <div className="list" style={{ marginTop: 10 }}>
            {categories.slice(0, 5).map((item) => {
              const meta = EXPENSE_CATEGORIES.find((entry) => entry.id === item.id)!;
              const Icon = meta.icon;
              return (
                <div className="list-row" key={item.id} style={{ padding: '7px 2px' }}>
                  <span className="stat-ico" style={{ background: '#fbf3ee', color: meta.color }}>
                    <Icon size={15} />
                  </span>
                  <div className="list-main">
                    <div className="list-title">{meta.label}</div>
                  </div>
                  <span className="small" style={{ fontWeight: 600 }}>
                    {money(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
          {categories.length ? (
            <div className="form-error" style={{ background: '#fdf6ee', color: '#8a5f13', marginTop: 12 }}>
              সবচেয়ে বেশি খরচ “{categories[0].label}” খাতে — মোট খরচের{' '}
              {num(percent(categories[0].value, stats.expenses))}%।
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>খরচের খাতা</h3>
            <div className="card-sub">
              {num(data.expenses.length)} টি এন্ট্রি · মোট {money(stats.expenses)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }} className="no-print">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                download('biye-khoroch.csv', expensesCsv(data));
                notify('CSV ফাইল ডাউনলোড হয়েছে');
              }}
            >
              <Download size={14} /> CSV
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setDraft(emptyDraft())}>
              <Plus size={14} /> নতুন খরচ
            </button>
          </div>
        </div>

        <div className="toolbar no-print">
          <div className="search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="বিবরণ বা প্রতিষ্ঠানের নাম খুঁজুন"
              aria-label="খুঁজুন"
            />
          </div>
          <select
            className="input auto"
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory | 'all')}
            aria-label="খাত"
          >
            <option value="all">সব খাত</option>
            {EXPENSE_CATEGORIES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {rows.length ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>বিবরণ</th>
                  <th>খাত</th>
                  <th>পরিশোধ</th>
                  <th>তারিখ</th>
                  <th className="num">টাকা</th>
                  <th className="no-print" style={{ textAlign: 'right' }}>
                    কাজ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const meta = EXPENSE_CATEGORIES.find((entry) => entry.id === item.category);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-name">
                          <span className="avatar" style={{ background: '#f6ecd7', color: '#8a5f13' }}>
                            {meta ? <meta.icon size={15} /> : <Package size={15} />}
                          </span>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.note || '—'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="chip grey">{labelOf(EXPENSE_CATEGORIES, item.category)}</span>
                      </td>
                      <td className="small">{item.paidTo || '—'}</td>
                      <td className="small">{bnDate(item.date)}</td>
                      <td className="num amount-out">{money(item.amount)}</td>
                      <td className="no-print">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setDraft({ ...item })}
                            aria-label="সম্পাদনা"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => handleDelete(item)}
                            aria-label="মুছুন"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>দেখানো হচ্ছে {num(rows.length)} টি খরচ</td>
                  <td className="num">{money(filteredTotal)}</td>
                  <td className="no-print" />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Receipt size={38} />}
            title={data.expenses.length ? 'এই ফিল্টারে কিছু নেই' : 'এখনো কোনো খরচ লেখা হয়নি'}
            note={
              data.expenses.length
                ? 'ফিল্টার বদলে দেখুন অথবা নতুন খরচ যোগ করুন।'
                : 'হল ভাড়া, ক্যাটারিং, পোশাক — যা যা খরচ হচ্ছে লিখে রাখুন।'
            }
            action={
              <button type="button" className="btn btn-primary" onClick={() => setDraft(emptyDraft())}>
                <Plus size={15} /> নতুন খরচ যোগ করুন
              </button>
            }
          />
        )}
      </div>

      {draft ? (
        <ExpenseForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={(item) => {
            saveExpense(item);
            setDraft(null);
            notify(item.id && data.expenses.some((row) => row.id === item.id) ? 'খরচ আপডেট হয়েছে' : 'নতুন খরচ যোগ হয়েছে');
          }}
        />
      ) : null}
    </>
  );
}

function ExpenseForm({
  draft,
  onClose,
  onSave,
}: {
  draft: Expense;
  onClose: () => void;
  onSave: (item: Expense) => void;
}) {
  const [form, setForm] = useState({ ...draft, amountText: draft.amount ? String(draft.amount) : '' });
  const [error, setError] = useState('');

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const amount = Number(form.amountText.replace(/[^\d.]/g, '')) || 0;
    if (!form.title.trim()) {
      setError('খরচের বিবরণ লিখুন।');
      return;
    }
    if (amount <= 0) {
      setError('টাকার পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }
    onSave({
      id: form.id || uid(),
      title: form.title.trim(),
      category: form.category,
      amount,
      date: form.date || todayISO(),
      paidTo: form.paidTo.trim(),
      note: form.note.trim(),
    });
  };

  return (
    <Modal
      title={draft.id ? 'খরচ সম্পাদনা' : 'নতুন খরচ যোগ করুন'}
      subtitle="কোথায় কত টাকা খরচ হলো লিখে রাখুন"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            বাতিল
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            সংরক্ষণ করুন
          </button>
        </>
      }
    >
      <div className="modal-body">
        <div className="form-grid">
          <Field label="খরচের বিবরণ *" span>
            <input
              className="input"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="যেমন: ক্যাটারিং অগ্রিম"
              autoFocus
            />
          </Field>
          <Field label="খাত">
            <select
              className="input"
              value={form.category}
              onChange={(event) => update('category', event.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="টাকার পরিমাণ (৳) *">
            <input
              className="input"
              inputMode="numeric"
              value={form.amountText}
              onChange={(event) => update('amountText', event.target.value)}
              placeholder="০"
            />
          </Field>
          <Field label="কাকে পরিশোধ">
            <input
              className="input"
              value={form.paidTo}
              onChange={(event) => update('paidTo', event.target.value)}
              placeholder="দোকান বা ব্যক্তির নাম"
            />
          </Field>
          <Field label="তারিখ">
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </Field>
          <Field label="নোট" span>
            <textarea
              className="input"
              rows={2}
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              placeholder="অতিরিক্ত তথ্য"
            />
          </Field>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
      </div>
    </Modal>
  );
}
