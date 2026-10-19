import { Download, FileText, Printer } from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { useStore } from '../store';
import {
  EXPENSE_CATEGORIES,
  METHODS,
  RELATIONS,
  SIDES,
  labelOf,
} from '../types';
import { bnDate, money, num, percent } from '../lib/format';
import { contributionsCsv, download, expensesCsv } from '../lib/csv';
import {
  byCategory,
  byMethod,
  byRelation,
  bySide,
  dueContributors,
  totals,
} from '../lib/selectors';

export function Reports() {
  const { data, notify } = useStore();
  const stats = useMemo(() => totals(data), [data]);
  const sides = useMemo(() => bySide(data.contributions), [data.contributions]);
  const relations = useMemo(() => byRelation(data.contributions), [data.contributions]);
  const methods = useMemo(() => byMethod(data.contributions), [data.contributions]);
  const categories = useMemo(() => byCategory(data.expenses), [data.expenses]);
  const due = useMemo(() => dueContributors(data.contributions), [data.contributions]);

  return (
    <>
      <div className="topbar-actions no-print" style={{ marginLeft: 0, justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            download('biye-adoay.csv', contributionsCsv(data));
            notify('আদায়ের CSV ডাউনলোড হয়েছে');
          }}
        >
          <Download size={14} /> আদায়ের CSV
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            download('biye-khoroch.csv', expensesCsv(data));
            notify('খরচের CSV ডাউনলোড হয়েছে');
          }}
        >
          <Download size={14} /> খরচের CSV
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => window.print()}>
          <Printer size={14} /> প্রিন্ট / PDF
        </button>
      </div>

      <div className="report-page">
        <div className="report-head">
          <div>
            <h2>{data.event.title || 'বিয়ে বাড়ির হিসাব'}</h2>
            <p className="muted small">
              {data.event.bride} ও {data.event.groom}
            </p>
            <p className="muted small">
              {bnDate(data.event.date)} · {data.event.venue || 'স্থান উল্লেখ নেই'}
            </p>
          </div>
          <div className="report-meta">
            <div>
              <strong>হিসাব বিবরণী</strong>
            </div>
            <div>মুদ্রণের তারিখ: {bnDate(new Date().toISOString().slice(0, 10))}</div>
            <div>মোট এন্ট্রি: {num(data.contributions.length + data.expenses.length)}</div>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: 22 }}>
          <div className="stat" style={{ '--accent': '#7a1730' } as CSSProperties}>
            <div className="stat-top">মোট আদায়</div>
            <div className="stat-value">{money(stats.collected)}</div>
            <div className="stat-foot">
              প্রতিশ্রুতির {num(stats.pledgeProgress)}% ({num(stats.contributors)} জন)
            </div>
          </div>
          <div className="stat" style={{ '--accent': '#8a5a9e' } as CSSProperties}>
            <div className="stat-top">বাকি আদায়</div>
            <div className="stat-value">{money(stats.due)}</div>
            <div className="stat-foot">{num(due.length)} জনের বাকি আছে</div>
          </div>
          <div className="stat" style={{ '--accent': '#bd8626' } as CSSProperties}>
            <div className="stat-top">মোট খরচ</div>
            <div className="stat-value">{money(stats.expenses)}</div>
            <div className="stat-foot">বাজেটের {num(stats.budgetProgress)}%</div>
          </div>
          <div className="stat" style={{ '--accent': '#2f6b4f' } as CSSProperties}>
            <div className="stat-top">হাতে আছে</div>
            <div className="stat-value">{money(stats.balance)}</div>
            <div className="stat-foot">আদায় − খরচ</div>
          </div>
        </div>

        <div className="split" style={{ gap: 28 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 8 }}>
              <FileText size={16} /> পক্ষ ও সম্পর্ক অনুযায়ী আদায়
            </h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>খাত</th>
                  <th className="num">জন</th>
                  <th className="num">টাকা</th>
                  <th className="num">শতাংশ</th>
                </tr>
              </thead>
              <tbody>
                {sides.map((item) => (
                  <tr key={`side-${item.id}`}>
                    <td>{labelOf(SIDES, item.id)}</td>
                    <td className="num">{num(item.count)}</td>
                    <td className="num">{money(item.value)}</td>
                    <td className="num">{num(percent(item.value, stats.collected))}%</td>
                  </tr>
                ))}
                {relations.map((item) => (
                  <tr key={`relation-${item.id}`}>
                    <td style={{ paddingLeft: 18 }}>{labelOf(RELATIONS, item.id)}</td>
                    <td className="num">{num(item.count)}</td>
                    <td className="num">{money(item.value)}</td>
                    <td className="num">{num(percent(item.value, stats.collected))}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>সর্বমোট</th>
                  <th className="num">{num(stats.contributors)}</th>
                  <th className="num">{money(stats.collected)}</th>
                  <th className="num">১০০%</th>
                </tr>
              </tfoot>
            </table>

            <h3 className="section-title" style={{ margin: '20px 0 8px' }}>
              <FileText size={16} /> পেমেন্টের মাধ্যম
            </h3>
            <table className="summary-table">
              <tbody>
                {methods.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        className="dot"
                        style={{ background: item.color, display: 'inline-block', marginRight: 8 }}
                      />
                      {labelOf(METHODS, item.id)}
                    </td>
                    <td className="num">{num(item.count)} জন</td>
                    <td className="num">{money(item.value)}</td>
                  </tr>
                ))}
                {!methods.length ? (
                  <tr>
                    <td className="muted">কোনো তথ্য নেই</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="section-title" style={{ marginBottom: 8 }}>
              <FileText size={16} /> খরচের খাতভিত্তিক হিসাব
            </h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>খাত</th>
                  <th className="num">এন্ট্রি</th>
                  <th className="num">টাকা</th>
                  <th className="num">শতাংশ</th>
                </tr>
              </thead>
              <tbody>
                {categories.length ? (
                  categories.map((item) => (
                    <tr key={item.id}>
                      <td>{labelOf(EXPENSE_CATEGORIES, item.id)}</td>
                      <td className="num">{num(item.count)}</td>
                      <td className="num">{money(item.value)}</td>
                      <td className="num">{num(percent(item.value, stats.expenses))}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="muted">
                      কোনো খরচ লেখা হয়নি
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th>সর্বমোট</th>
                  <th className="num">{num(data.expenses.length)}</th>
                  <th className="num">{money(stats.expenses)}</th>
                  <th className="num">{stats.expenses ? '১০০%' : '—'}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <h3 className="section-title" style={{ margin: '24px 0 8px' }}>
          <FileText size={16} /> বাকি আদায়ের তালিকা
        </h3>
        {due.length ? (
          <table className="summary-table">
            <thead>
              <tr>
                <th>নাম</th>
                <th>পক্ষ</th>
                <th>সম্পর্ক</th>
                <th className="num">প্রতিশ্রুতি</th>
                <th className="num">পেয়েছি</th>
                <th className="num">বাকি</th>
              </tr>
            </thead>
            <tbody>
              {due.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{labelOf(SIDES, item.side)}</td>
                  <td>{labelOf(RELATIONS, item.relation)}</td>
                  <td className="num">{money(Math.max(item.pledged, item.amount))}</td>
                  <td className="num">{money(item.amount)}</td>
                  <td className="num">{money(item.pledged - item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={5}>মোট বাকি</th>
                <th className="num">{money(stats.due)}</th>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="muted small">সব প্রতিশ্রুতি পুরোপুরি আদায় হয়েছে। 🎉</p>
        )}

        <div className="signature">
          <span>হিসাব রক্ষক</span>
          <span>পরিবারের প্রধান</span>
          <span>তারিখ</span>
        </div>
      </div>
    </>
  );
}
