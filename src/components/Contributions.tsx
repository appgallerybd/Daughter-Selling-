import { Download, HandCoins, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  METHODS,
  RELATIONS,
  SIDES,
  labelOf,
  type Contribution,
  type Method,
  type Relation,
  type Side,
} from '../types';
import { bnDate, money, num, todayISO, uid } from '../lib/format';
import { contributionsCsv, download } from '../lib/csv';
import { EmptyState, Field, Modal } from './ui';

type StatusFilter = 'all' | 'due' | 'paid';
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name';

const emptyDraft = (): Contribution => ({
  id: '',
  name: '',
  phone: '',
  side: 'groom',
  relation: 'relative',
  method: 'cash',
  amount: 0,
  pledged: 0,
  date: todayISO(),
  note: '',
});

export function Contributions() {
  const { data, saveContribution, removeContribution, notify } = useStore();
  const [query, setQuery] = useState('');
  const [side, setSide] = useState<Side | 'all'>('all');
  const [relation, setRelation] = useState<Relation | 'all'>('all');
  const [method, setMethod] = useState<Method | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('date-desc');
  const [draft, setDraft] = useState<Contribution | null>(null);

  const rows = useMemo(() => {
    const filtered = data.contributions.filter((item) => {
      if (side !== 'all' && item.side !== side) return false;
      if (relation !== 'all' && item.relation !== relation) return false;
      if (method !== 'all' && item.method !== method) return false;
      if (status === 'due' && item.amount >= item.pledged) return false;
      if (status === 'paid' && item.amount < item.pledged) return false;
      if (query.trim()) {
        const needle = query.trim().toLowerCase();
        const haystack = `${item.name} ${item.phone} ${item.note}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.date.localeCompare(b.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'name':
          return a.name.localeCompare(b.name, 'bn');
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [data.contributions, method, query, relation, side, sort, status]);

  const filteredTotal = rows.reduce((sum, item) => sum + item.amount, 0);
  const filteredPledged = rows.reduce((sum, item) => sum + Math.max(item.pledged, item.amount), 0);

  const openNew = () => setDraft(emptyDraft());
  const openEdit = (item: Contribution) => setDraft({ ...item });

  const handleDelete = (item: Contribution) => {
    if (!window.confirm(`“${item.name}” এর এন্ট্রিটি মুছে ফেলবেন?`)) return;
    removeContribution(item.id);
    notify('এন্ট্রি মুছে ফেলা হয়েছে');
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>টাকা ওঠার খাতা</h3>
          <div className="card-sub">
            মোট {num(data.contributions.length)} টি এন্ট্রি · আদায়{' '}
            {money(data.contributions.reduce((sum, item) => sum + item.amount, 0))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }} className="no-print">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              download('biye-adoay.csv', contributionsCsv(data));
              notify('CSV ফাইল ডাউনলোড হয়েছে');
            }}
          >
            <Download size={14} /> CSV
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={openNew}>
            <Plus size={14} /> নতুন এন্ট্রি
          </button>
        </div>
      </div>

      <div className="toolbar no-print">
        <div className="search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="নাম, ফোন বা নোট খুঁজুন"
            aria-label="খুঁজুন"
          />
        </div>
        <select
          className="input auto"
          value={side}
          onChange={(event) => setSide(event.target.value as Side | 'all')}
          aria-label="পক্ষ"
        >
          <option value="all">সব পক্ষ</option>
          {SIDES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="input auto"
          value={relation}
          onChange={(event) => setRelation(event.target.value as Relation | 'all')}
          aria-label="সম্পর্ক"
        >
          <option value="all">সব সম্পর্ক</option>
          {RELATIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="input auto"
          value={method}
          onChange={(event) => setMethod(event.target.value as Method | 'all')}
          aria-label="মাধ্যম"
        >
          <option value="all">সব মাধ্যম</option>
          {METHODS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="input auto"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="অবস্থা"
        >
          <option value="all">সব অবস্থা</option>
          <option value="due">বাকি আছে</option>
          <option value="paid">পুরো এসেছে</option>
        </select>
        <select
          className="input auto"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          aria-label="সাজান"
        >
          <option value="date-desc">নতুন আগে</option>
          <option value="date-asc">পুরোনো আগে</option>
          <option value="amount-desc">বেশি টাকা আগে</option>
          <option value="amount-asc">কম টাকা আগে</option>
          <option value="name">নাম অনুযায়ী</option>
        </select>
      </div>

      {rows.length ? (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>অনুদানকারী</th>
                  <th>পক্ষ / সম্পর্ক</th>
                  <th>তারিখ</th>
                  <th>মাধ্যম</th>
                  <th className="num">প্রতিশ্রুতি</th>
                  <th className="num">প্রাপ্তি</th>
                  <th className="num">বাকি</th>
                  <th className="no-print" style={{ textAlign: 'right' }}>
                    কাজ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const dueAmount = Math.max(0, item.pledged - item.amount);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cell-name">
                          <span className="avatar">{item.name.slice(0, 1)}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.phone || item.note || '—'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${item.side === 'bride' ? 'gold' : ''}`}>
                          {labelOf(SIDES, item.side)}
                        </span>{' '}
                        <span className="muted small">{labelOf(RELATIONS, item.relation)}</span>
                      </td>
                      <td className="small">{bnDate(item.date)}</td>
                      <td className="small">{labelOf(METHODS, item.method)}</td>
                      <td className="num">{money(Math.max(item.pledged, item.amount))}</td>
                      <td className="num amount-in">{money(item.amount)}</td>
                      <td className="num">
                        {dueAmount > 0 ? (
                          <span className="chip red">{money(dueAmount)}</span>
                        ) : (
                          <span className="chip green">পরিশোধিত</span>
                        )}
                      </td>
                      <td className="no-print">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => openEdit(item)}
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
                  <td colSpan={4}>
                    দেখানো হচ্ছে {num(rows.length)} টি এন্ট্রি
                  </td>
                  <td className="num">{money(filteredPledged)}</td>
                  <td className="num">{money(filteredTotal)}</td>
                  <td className="num">{money(Math.max(0, filteredPledged - filteredTotal))}</td>
                  <td className="no-print" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<HandCoins size={38} />}
          title={data.contributions.length ? 'এই ফিল্টারে কিছু পাওয়া যায়নি' : 'এখনো কোনো এন্ট্রি নেই'}
          note={
            data.contributions.length
              ? 'ফিল্টার বদলে আবার দেখুন, অথবা নতুন এন্ট্রি যোগ করুন।'
              : 'প্রথম অনুদানের নাম ও টাকা লিখে হিসাব শুরু করুন।'
          }
          action={
            <button type="button" className="btn btn-primary" onClick={openNew}>
              <Plus size={15} /> নতুন এন্ট্রি যোগ করুন
            </button>
          }
        />
      )}

      {draft ? (
        <ContributionForm
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={(item) => {
            const isNew = !data.contributions.some((row) => row.id === item.id);
            saveContribution(item);
            setDraft(null);
            notify(isNew ? 'নতুন এন্ট্রি যোগ হয়েছে' : 'এন্ট্রি আপডেট হয়েছে');
          }}
        />
      ) : null}
    </div>
  );
}

function ContributionForm({
  draft,
  onClose,
  onSave,
}: {
  draft: Contribution;
  onClose: () => void;
  onSave: (item: Contribution) => void;
}) {
  const [form, setForm] = useState({
    ...draft,
    amountText: draft.amount ? String(draft.amount) : '',
    pledgedText: draft.pledged ? String(draft.pledged) : '',
  });
  const [error, setError] = useState('');

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const amount = Number(form.amountText.replace(/[^\d.]/g, '')) || 0;
    const pledgedInput = Number(form.pledgedText.replace(/[^\d.]/g, '')) || 0;
    if (!form.name.trim()) {
      setError('অনুদানকারীর নাম লিখুন।');
      return;
    }
    if (amount <= 0) {
      setError('প্রাপ্ত টাকার পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }
    if (pledgedInput && pledgedInput < amount) {
      setError('প্রতিশ্রুতির পরিমাণ প্রাপ্তির চেয়ে কম হতে পারে না।');
      return;
    }
    onSave({
      id: form.id || uid(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      side: form.side,
      relation: form.relation,
      method: form.method,
      amount,
      pledged: pledgedInput || amount,
      date: form.date || todayISO(),
      note: form.note.trim(),
    });
  };

  return (
    <Modal
      title={draft.id ? 'এন্ট্রি সম্পাদনা' : 'নতুন অনুদান যোগ করুন'}
      subtitle="যতটুকু টাকা হাতে এসেছে সেটি প্রাপ্তিতে লিখুন"
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
          <Field label="অনুদানকারীর নাম *">
            <input
              className="input"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="যেমন: মোঃ শাহজাহান"
              autoFocus
            />
          </Field>
          <Field label="মোবাইল নম্বর">
            <input
              className="input"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Field label="কোন পক্ষ">
            <select
              className="input"
              value={form.side}
              onChange={(event) => update('side', event.target.value as Side)}
            >
              {SIDES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="সম্পর্ক">
            <select
              className="input"
              value={form.relation}
              onChange={(event) => update('relation', event.target.value as Relation)}
            >
              {RELATIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="প্রতিশ্রুতি (৳)" hint="মোট যত টাকা দেওয়ার কথা দিয়েছেন">
            <input
              className="input"
              inputMode="numeric"
              value={form.pledgedText}
              onChange={(event) => update('pledgedText', event.target.value)}
              placeholder="০"
            />
          </Field>
          <Field label="প্রাপ্তি (৳) *" hint="এখন পর্যন্ত হাতে এসেছে">
            <input
              className="input"
              inputMode="numeric"
              value={form.amountText}
              onChange={(event) => update('amountText', event.target.value)}
              placeholder="০"
            />
          </Field>
          <Field label="পেমেন্টের মাধ্যম">
            <select
              className="input"
              value={form.method}
              onChange={(event) => update('method', event.target.value as Method)}
            >
              {METHODS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
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
              placeholder="যেমন: কনের মামার পক্ষ থেকে নগদে দেওয়া হয়েছে"
            />
          </Field>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
      </div>
    </Modal>
  );
}
