import {
  FileBarChart,
  HandCoins,
  Heart,
  LayoutDashboard,
  Receipt,
  Settings2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Contributions } from './components/Contributions';
import { Dashboard } from './components/Dashboard';
import { Expenses } from './components/Expenses';
import { ImportDialog } from './components/ImportDialog';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { bnDate, daysUntil, money, num } from './lib/format';
import { clearShareLocation, decodeShareCode, readShareCodeFromLocation } from './lib/share';
import { totals } from './lib/selectors';
import { StoreProvider, useStore } from './store';
import type { AppData, TabId } from './types';

const NAV: { id: TabId; label: string; short: string; icon: typeof LayoutDashboard; sub: string }[] = [
  {
    id: 'dashboard',
    label: 'ড্যাশবোর্ড',
    short: 'হোম',
    icon: LayoutDashboard,
    sub: 'বিয়ে বাড়ির টাকা ওঠার সম্পূর্ণ চিত্র',
  },
  {
    id: 'collections',
    label: 'টাকা ওঠা',
    short: 'আদায়',
    icon: HandCoins,
    sub: 'অনুদানকারীর তালিকা, বাকি ও আদায়ের খাতা',
  },
  {
    id: 'expenses',
    label: 'খরচের হিসাব',
    short: 'খরচ',
    icon: Receipt,
    sub: 'কোথায় কত টাকা খরচ হলো তার হিসাব',
  },
  {
    id: 'reports',
    label: 'রিপোর্ট',
    short: 'রিপোর্ট',
    icon: FileBarChart,
    sub: 'প্রিন্ট ও PDF-এর জন্য পূর্ণ হিসাব বিবরণী',
  },
  {
    id: 'settings',
    label: 'সেটিংস',
    short: 'সেটিংস',
    icon: Settings2,
    sub: 'বিয়ের তথ্য, লক্ষ্য ও ব্যাকআপ',
  },
];

function Shell() {
  const { data, toast, notify } = useStore();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const stats = useMemo(() => totals(data), [data]);
  const current = NAV.find((item) => item.id === tab) ?? NAV[0];
  const remaining = daysUntil(data.event.date);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  // শেয়ার লিংক (#d=...) দিয়ে ঢুকলে হিসাবটি নিজে থেকেই পড়ে নেওয়া হয়
  useEffect(() => {
    let alive = true;

    const check = () => {
      const code = readShareCodeFromLocation();
      if (!code) return;
      decodeShareCode(code)
        .then((payload) => {
          if (alive) setIncoming(payload);
        })
        .catch(() => {
          if (alive) notify('লিংকের হিসাবটি পড়া যায়নি — আবার শেয়ার করতে বলুন');
        })
        .finally(() => {
          if (alive) clearShareLocation();
        });
    };

    check();
    // অ্যাপ খোলা থাকা অবস্থায় লিংকে ক্লিক করলেও যেন কাজ করে
    window.addEventListener('hashchange', check);
    return () => {
      alive = false;
      window.removeEventListener('hashchange', check);
    };
  }, [notify]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Heart size={21} fill="currentColor" />
          </span>
          <div>
            <div className="brand-title">বিয়ে হিসাব</div>
            <div className="brand-sub">টাকা ওঠা ও খরচের খাতা</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">মেনু</div>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item${tab === item.id ? ' active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                <Icon size={17} />
                {item.label}
                {item.id === 'collections' ? (
                  <span className="nav-badge">{num(stats.contributors)}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div>
            মোট আদায় <strong>{money(stats.collected)}</strong>
          </div>
          <div>
            হাতে আছে <strong>{money(stats.balance)}</strong>
          </div>
          <div style={{ marginTop: 8 }}>{bnDate(data.event.date)}</div>
          <div>
            {remaining > 0 ? `${num(remaining)} দিন বাকি` : remaining === 0 ? 'আজই বিয়ে' : 'বিয়ে সম্পন্ন'}
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1>{current.label}</h1>
            <div className="topbar-sub">{current.sub}</div>
          </div>
          <div className="topbar-actions no-print">
            <span className="chip gold">
              {remaining > 0 ? `${num(remaining)} দিন বাকি` : remaining === 0 ? 'আজ বিয়ে!' : 'বিয়ে সম্পন্ন'}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => window.print()}>
              প্রিন্ট
            </button>
          </div>
        </header>

        <main className="content">
          {tab === 'dashboard' ? <Dashboard onNavigate={setTab} /> : null}
          {tab === 'collections' ? <Contributions /> : null}
          {tab === 'expenses' ? <Expenses /> : null}
          {tab === 'reports' ? <Reports /> : null}
          {tab === 'settings' ? <Settings /> : null}
        </main>
      </div>

      <nav className="mobile-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'active' : ''}
              onClick={() => setTab(item.id)}
            >
              <Icon size={19} />
              {item.short}
            </button>
          );
        })}
      </nav>

      {toast ? <div className="toast">{toast}</div> : null}
      {incoming ? <ImportDialog payload={incoming} auto onClose={() => setIncoming(null)} /> : null}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
