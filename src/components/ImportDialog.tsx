import { AlertTriangle, ArrowRightLeft, Check, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { bnDate, money, num } from '../lib/format';
import { totals } from '../lib/selectors';
import { useStore } from '../store';
import type { AppData } from '../types';
import { Modal } from './ui';

/**
 * শেয়ার কোড/লিংক থেকে পাওয়া হিসাব দেখিয়ে নেওয়ার অনুমতি চায়।
 * `auto` হলে বোঝায় লিংক থেকেই সরাসরি এসেছে।
 */
export function ImportDialog({
  payload,
  auto = false,
  onClose,
}: {
  payload: AppData;
  auto?: boolean;
  onClose: () => void;
}) {
  const { data, importData, mergeData, notify } = useStore();
  const [busy, setBusy] = useState<'replace' | 'merge' | null>(null);

  const incoming = useMemo(() => totals(payload), [payload]);
  const current = useMemo(() => totals(data), [data]);

  const newContributions = useMemo(() => {
    const ids = new Set(data.contributions.map((row) => row.id));
    return payload.contributions.filter((row) => !ids.has(row.id)).length;
  }, [data.contributions, payload.contributions]);

  const newExpenses = useMemo(() => {
    const ids = new Set(data.expenses.map((row) => row.id));
    return payload.expenses.filter((row) => !ids.has(row.id)).length;
  }, [data.expenses, payload.expenses]);

  const isEmpty = !current.contributors && !data.expenses.length;

  const takeAll = (mode: 'replace' | 'merge') => {
    setBusy(mode);
    if (mode === 'replace') importData(payload);
    else mergeData(payload);
    notify(
      mode === 'replace'
        ? 'শেয়ার করা হিসাব এখানে বসানো হয়েছে'
        : `যোগ হয়েছে — ${num(newContributions)} টি আদায় ও ${num(newExpenses)} টি খরচের নতুন এন্ট্রি`,
    );
    onClose();
  };

  return (
    <Modal
      title="শেয়ার করা হিসাব পাওয়া গেছে"
      subtitle={auto ? 'লিংক থেকে হিসাবটি পড়া হয়েছে — নেওয়ার আগে দেখে নিন' : 'কোড যাচাই হয়েছে'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            বাতিল
          </button>
          <button type="button" className="btn" onClick={() => takeAll('replace')} disabled={busy !== null}>
            <Download size={15} /> {isEmpty ? 'হিসাবটি নিন' : 'সব প্রতিস্থাপন'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => takeAll('merge')}
            disabled={busy !== null}
          >
            <ArrowRightLeft size={15} /> একসাথে যোগ করুন
          </button>
        </>
      }
    >
      <div className="modal-body share-preview">
        <div className="share-preview-head">
          <div className="share-preview-title">{payload.event.title || 'বিয়ে বাড়ির হিসাব'}</div>
          <div className="share-preview-sub">
            {[payload.event.bride, payload.event.groom].filter(Boolean).join(' ও ') || 'নাম দেওয়া নেই'}
            {payload.event.date ? ` · ${bnDate(payload.event.date)}` : ''}
            {payload.event.venue ? ` · ${payload.event.venue}` : ''}
          </div>
        </div>

        <div className="share-preview-grid">
          <div>
            <span>মোট আদায়</span>
            <strong>{money(incoming.collected)}</strong>
          </div>
          <div>
            <span>মোট খরচ</span>
            <strong>{money(incoming.expenses)}</strong>
          </div>
          <div>
            <span>হাতে আছে</span>
            <strong>{money(incoming.balance)}</strong>
          </div>
          <div>
            <span>এন্ট্রি</span>
            <strong>
              {num(payload.contributions.length)} আদায় · {num(payload.expenses.length)} খরচ
            </strong>
          </div>
        </div>

        {!isEmpty ? (
          <div className="share-note">
            <AlertTriangle size={16} />
            <div>
              এই ব্রাউজারে এখন <strong>{num(current.contributors)}</strong> টি আদায় ও{' '}
              <strong>{num(data.expenses.length)}</strong> টি খরচের এন্ট্রি আছে। “সব প্রতিস্থাপন” করলে
              সেগুলো মুছে শুধু শেয়ার করা হিসাব থাকবে; “একসাথে যোগ করুন” করলে দুই দিকের এন্ট্রি একসাথে
              থাকবে (নতুন {num(newContributions)} আদায়, {num(newExpenses)} খরচ যোগ হবে)।
            </div>
          </div>
        ) : (
          <div className="share-note ok">
            <Check size={16} />
            <div>এই ডিভাইসে আগের কোনো এন্ট্রি নেই — হিসাবটি সরাসরি নিয়ে নিতে পারেন।</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
