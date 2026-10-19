import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Coins,
  HandCoins,
  MapPin,
  PiggyBank,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../store';
import type { TabId } from '../types';
import { METHODS, RELATIONS, SIDES, labelOf } from '../types';
import { bnDate, daysUntil, money, num } from '../lib/format';
import {
  byCategory,
  byMethod,
  byRelation,
  bySide,
  dailySeries,
  dueContributors,
  recentActivity,
  topContributors,
  totals,
} from '../lib/selectors';
import { CollectionTrend, DonutChart, RankedBars } from './charts';
import { EmptyState, ProgressRing, StatCard } from './ui';

export function Dashboard({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data } = useStore();
  const stats = useMemo(() => totals(data), [data]);
  const points = useMemo(() => dailySeries(data.contributions), [data.contributions]);
  const sides = useMemo(() => bySide(data.contributions), [data.contributions]);
  const relations = useMemo(() => byRelation(data.contributions), [data.contributions]);
  const methods = useMemo(() => byMethod(data.contributions), [data.contributions]);
  const categories = useMemo(() => byCategory(data.expenses), [data.expenses]);
  const top = useMemo(() => topContributors(data.contributions, 5), [data.contributions]);
  const activity = useMemo(
    () => recentActivity(data.contributions, data.expenses, 6),
    [data.contributions, data.expenses],
  );
  const due = useMemo(() => dueContributors(data.contributions), [data.contributions]);

  const remaining = daysUntil(data.event.date);
  const countdown =
    remaining > 0 ? `${num(remaining)} দিন বাকি` : remaining === 0 ? 'আজ বিয়ে!' : 'বিয়ে সম্পন্ন';

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">
            <Sparkles size={13} /> {data.event.title || 'বিয়ে বাড়ির হিসাব'}
          </span>
          <h2 className="hero-names">
            {data.event.bride || 'কন্যা'} <span>ও</span> {data.event.groom || 'বর'}
          </h2>
          <div className="hero-meta">
            <span>
              <CalendarDays size={14} /> {bnDate(data.event.date)}
            </span>
            {data.event.venue ? (
              <span>
                <MapPin size={14} /> {data.event.venue}
              </span>
            ) : null}
            <span>
              <Users size={14} /> {num(stats.contributors)} জন অনুদান দিয়েছেন
            </span>
          </div>

          <div className="hero-progress">
            <div className="hero-progress-top">
              <span>
                আদায় {money(stats.collected)} / লক্ষ্য {money(stats.target)}
              </span>
              <span>{num(stats.targetProgress)}%</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${stats.targetProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="hero-ring">
          <ProgressRing value={stats.targetProgress}>
            <div style={{ fontSize: 11, color: 'rgba(255,236,239,.7)' }}>লক্ষ্য পূরণ</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 27, color: '#fff' }}>
              {num(stats.targetProgress)}%
            </div>
          </ProgressRing>
          <div className="hero-ring-caption">
            <div style={{ color: '#f2d49b', fontWeight: 600, marginBottom: 4 }}>{countdown}</div>
            <div>লক্ষ্য থেকে বাকি</div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
              {money(Math.max(0, stats.target - stats.collected))}
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard
          label="মোট আদায়"
          value={money(stats.collected)}
          icon={<HandCoins size={15} />}
          accent="#7a1730"
          accentSoft="#f8ebee"
          foot={
            <>
              <ArrowUpRight size={13} className="trend-up" /> প্রতিশ্রুতির{' '}
              {num(stats.pledgeProgress)}% এসেছে
            </>
          }
        />
        <StatCard
          label="মোট খরচ"
          value={money(stats.expenses)}
          icon={<Receipt size={15} />}
          accent="#bd8626"
          accentSoft="#f6ecd7"
          foot={
            <>
              বাজেট {money(stats.budget)} · ব্যবহার {num(stats.budgetProgress)}%
            </>
          }
        />
        <StatCard
          label="হাতে আছে"
          value={money(stats.balance)}
          icon={<Wallet size={15} />}
          accent={stats.balance >= 0 ? '#2f6b4f' : '#b3261e'}
          accentSoft={stats.balance >= 0 ? '#e8f2eb' : '#fbe9e7'}
          foot={
            <>
              {stats.balance >= 0 ? (
                <>
                  <ArrowUpRight size={13} className="trend-up" /> আদায় বাদে খরচের পর উদ্বৃত্ত
                </>
              ) : (
                <>
                  <ArrowDownRight size={13} className="trend-down" /> ঘাটতি — খরচ কমাতে হবে
                </>
              )}
            </>
          }
        />
        <StatCard
          label="বাকি আদায়"
          value={money(stats.due)}
          icon={<Coins size={15} />}
          accent="#8a5a9e"
          accentSoft="#f1eaf5"
          foot={
            <>
              {num(due.length)} জনের প্রতিশ্রুতি এখনো পুরো আসেনি
            </>
          }
        />
      </section>

      <section className="chart-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>টাকা ওঠার ধারা</h3>
              <div className="card-sub">প্রতিদিনের আদায় ও ক্রমপুঞ্জিত মোট</div>
            </div>
            <span className="chip gold">{num(points.length)} দিনের তথ্য</span>
          </div>
          {points.length ? (
            <>
              <div className="chart-body tall">
                <CollectionTrend points={points} />
              </div>
              <div className="legend">
                <span className="legend-item">
                  <span className="dot" style={{ background: 'linear-gradient(180deg,#a32847,#e2c8a0)' }} />
                  সেদিনের আদায়
                </span>
                <span className="legend-item">
                  <span className="dot" style={{ background: '#6d1026' }} />
                  ক্রমপুঞ্জিত মোট
                </span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Coins size={34} />}
              title="এখনো কোনো আদায় লেখা হয়নি"
              note="প্রথম এন্ট্রি যোগ করলেই এখানে চার্ট দেখা যাবে।"
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>পক্ষ অনুযায়ী আদায়</h3>
              <div className="card-sub">বর ও কনের পক্ষের তুলনা</div>
            </div>
          </div>
          {sides.length ? (
            <>
              <DonutChart data={sides} centerLabel="মোট আদায়" centerValue={money(stats.collected)} />
              <div className="legend" style={{ flexDirection: 'column', gap: 8 }}>
                {sides.map((slice) => (
                  <div key={slice.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="dot" style={{ background: slice.color }} />
                    <span>{labelOf(SIDES, slice.id)}</span>
                    <span className="muted small">({num(slice.count)} জন)</span>
                    <strong style={{ marginLeft: 'auto', fontWeight: 600 }}>{money(slice.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Users size={34} />}
              title="কোনো অনুদান নেই"
              note="এন্ট্রি যোগ করলে দুই পক্ষের তুলনা দেখা যাবে।"
            />
          )}
        </div>
      </section>

      <section className="chart-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>সম্পর্ক অনুযায়ী আদায়</h3>
              <div className="card-sub">কোন সূত্র থেকে কত টাকা এসেছে</div>
            </div>
            <span className="chip">{num(stats.contributors)} জন</span>
          </div>
          <RankedBars data={relations} total={stats.collected} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>খরচের খাত</h3>
              <div className="card-sub">মোট খরচ {money(stats.expenses)}</div>
            </div>
          </div>
          {categories.length ? (
            <>
              <DonutChart
                data={categories}
                centerLabel="মোট খরচ"
                centerValue={money(stats.expenses)}
              />
              <div className="legend" style={{ flexDirection: 'column', gap: 7 }}>
                {categories.slice(0, 4).map((slice) => (
                  <div key={slice.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="dot" style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                    <strong style={{ marginLeft: 'auto', fontWeight: 600 }}>{money(slice.value)}</strong>
                  </div>
                ))}
                {categories.length > 4 ? (
                  <div className="muted small">আরও {num(categories.length - 4)} টি খাত রয়েছে</div>
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<PiggyBank size={34} />}
              title="এখনো কোনো খরচ নেই"
              note="খরচ যোগ করলে খাতভিত্তিক বিভাজন দেখা যাবে।"
            />
          )}
        </div>
      </section>

      <section className="split">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>শীর্ষ অনুদানকারী</h3>
              <div className="card-sub">সবচেয়ে বেশি টাকা যাঁরা দিয়েছেন</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('collections')}>
              সব দেখুন
            </button>
          </div>
          {top.length ? (
            <div className="list">
              {top.map((item, index) => (
                <div className="list-row" key={item.id}>
                  <span className={`rank${index === 0 ? ' gold' : ''}`}>{num(index + 1)}</span>
                  <div className="list-main">
                    <div className="list-title">{item.name}</div>
                    <div className="list-sub">
                      {labelOf(RELATIONS, item.relation)} · {labelOf(SIDES, item.side)} ·{' '}
                      {labelOf(METHODS, item.method)}
                    </div>
                  </div>
                  <span className="amount-in">{money(item.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<HandCoins size={30} />}
              title="তালিকা খালি"
              note="অনুদানের এন্ট্রি দিলে এখানে নাম উঠে আসবে।"
            />
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>সাম্প্রতিক লেনদেন</h3>
              <div className="card-sub">টাকা আসা ও খরচের সর্বশেষ তথ্য</div>
            </div>
          </div>
          {activity.length ? (
            <div className="list">
              {activity.map((item) => (
                <div className="list-row" key={item.id}>
                  <span
                    className="stat-ico"
                    style={{
                      background: item.kind === 'in' ? '#e8f2eb' : '#fbe9e7',
                      color: item.kind === 'in' ? '#2f6b4f' : '#b3261e',
                    }}
                  >
                    {item.kind === 'in' ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div className="list-main">
                    <div className="list-title">{item.title}</div>
                    <div className="list-sub">
                      {item.kind === 'in' ? 'আদায়' : 'খরচ'} · {bnDate(item.date)}
                    </div>
                  </div>
                  <span className={item.kind === 'in' ? 'amount-in' : 'amount-out'}>
                    {item.kind === 'in' ? '+' : '−'} {money(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Receipt size={30} />}
              title="কোনো লেনদেন নেই"
              note="আদায় বা খরচ যোগ করলে এখানে দেখা যাবে।"
            />
          )}
        </div>
      </section>

      {due.length ? (
        <section className="card">
          <div className="card-head">
            <div>
              <h3>বাকি আদায়ের তালিকা</h3>
              <div className="card-sub">
                {num(due.length)} জনের কাছে মোট {money(stats.due)} বাকি
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('collections')}>
              হিসাব দেখুন
            </button>
          </div>
          <div className="list">
            {due.slice(0, 4).map((item) => (
              <div className="list-row" key={item.id}>
                <span className="avatar">{item.name.slice(0, 1)}</span>
                <div className="list-main">
                  <div className="list-title">{item.name}</div>
                  <div className="list-sub">
                    প্রতিশ্রুতি {money(Math.max(item.pledged, item.amount))} · পেয়েছি{' '}
                    {money(item.amount)}
                  </div>
                </div>
                <span className="chip red">বাকি {money(item.pledged - item.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card" style={{ background: 'linear-gradient(180deg,#fff, #fdf6ee)' }}>
        <div className="card-head">
          <div>
            <h3>এক নজরে</h3>
            <div className="card-sub">হিসাবের গুরুত্বপূর্ণ কিছু সংখ্যা</div>
          </div>
          <span className="chip gold">
            <Sparkles size={12} /> সারসংক্ষেপ
          </span>
        </div>
        <div className="stat-grid">
          <div className="progress-row" style={{ border: 0 }}>
            <div className="progress-top">
              <span className="muted small">গড় অনুদান</span>
            </div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
              {money(stats.average)}
            </strong>
          </div>
          <div className="progress-row" style={{ border: 0 }}>
            <div className="progress-top">
              <span className="muted small">সর্বোচ্চ অনুদান</span>
            </div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
              {money(stats.largest)}
            </strong>
          </div>
          <div className="progress-row" style={{ border: 0 }}>
            <div className="progress-top">
              <span className="muted small">প্রতিশ্রুতি পুরো এসেছে</span>
            </div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
              {num(stats.fullyPaid)} / {num(stats.contributors)} জন
            </strong>
          </div>
          <div className="progress-row" style={{ border: 0 }}>
            <div className="progress-top">
              <span className="muted small">বাজেট বাকি</span>
            </div>
            <strong
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: stats.budgetLeft >= 0 ? '#2f6b4f' : '#b3261e',
              }}
            >
              {money(stats.budgetLeft)}
            </strong>
          </div>
        </div>
        <div className="legend" style={{ marginTop: 6 }}>
          {methods.map((item) => (
            <span className="legend-item" key={item.id}>
              <span className="dot" style={{ background: item.color }} />
              {item.label} · {money(item.value)}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
