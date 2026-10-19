import { Database, Download, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { AppData, EventInfo } from '../types';
import { download } from '../lib/csv';
import { ShareData } from './ShareData';
import { Field } from './ui';

export function Settings() {
  const { data, saveEvent, resetToDemo, clearAll, importData, notify } = useStore();
  const [form, setForm] = useState({
    ...data.event,
    targetText: String(data.event.target || ''),
    budgetText: String(data.event.budget || ''),
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const next: EventInfo = {
      title: form.title.trim() || 'বিয়ে বাড়ির হিসাব',
      bride: form.bride.trim(),
      groom: form.groom.trim(),
      date: form.date,
      venue: form.venue.trim(),
      target: Number(form.targetText.replace(/[^\d.]/g, '')) || 0,
      budget: Number(form.budgetText.replace(/[^\d.]/g, '')) || 0,
    };
    saveEvent(next);
    notify('বিয়ের তথ্য সংরক্ষণ হয়েছে');
  };

  const exportJson = () => {
    download(
      `biye-hisab-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json',
    );
    notify('ব্যাকআপ ফাইল ডাউনলোড হয়েছে');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (!parsed || !Array.isArray(parsed.contributions)) throw new Error('invalid');
        importData(parsed);
        setForm({
          ...parsed.event,
          targetText: String(parsed.event?.target ?? ''),
          budgetText: String(parsed.event?.budget ?? ''),
        });
        notify('ব্যাকআপ থেকে হিসাব ফিরিয়ে আনা হয়েছে');
      } catch {
        notify('ফাইলটি পড়া যায়নি — সঠিক ব্যাকআপ ফাইল দিন');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="split">
      <div className="card">
        <div className="card-head">
          <div>
            <h3>বিয়ের তথ্য</h3>
            <div className="card-sub">এই তথ্যগুলো ড্যাশবোর্ড ও রিপোর্টে দেখা যাবে</div>
          </div>
        </div>
        <div className="form-grid">
          <Field label="অনুষ্ঠানের নাম" span>
            <input
              className="input"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="যেমন: তানিয়া ও রাফিদের বিয়ে"
            />
          </Field>
          <Field label="কনের নাম">
            <input
              className="input"
              value={form.bride}
              onChange={(event) => update('bride', event.target.value)}
            />
          </Field>
          <Field label="বরের নাম">
            <input
              className="input"
              value={form.groom}
              onChange={(event) => update('groom', event.target.value)}
            />
          </Field>
          <Field label="বিয়ের তারিখ">
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </Field>
          <Field label="স্থান">
            <input
              className="input"
              value={form.venue}
              onChange={(event) => update('venue', event.target.value)}
              placeholder="কমিউনিটি সেন্টার / বাড়ি"
            />
          </Field>
          <Field label="টাকা ওঠানোর লক্ষ্য (৳)" hint="ড্যাশবোর্ডের অগ্রগতি এই লক্ষ্যের সাপেক্ষে">
            <input
              className="input"
              inputMode="numeric"
              value={form.targetText}
              onChange={(event) => update('targetText', event.target.value)}
            />
          </Field>
          <Field label="খরচের বাজেট (৳)">
            <input
              className="input"
              inputMode="numeric"
              value={form.budgetText}
              onChange={(event) => update('budgetText', event.target.value)}
            />
          </Field>
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-primary" onClick={submit}>
            <Save size={15} /> সংরক্ষণ করুন
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>ডেটা ও ব্যাকআপ</h3>
            <div className="card-sub">সব হিসাব এই ব্রাউজারেই সংরক্ষিত থাকে</div>
          </div>
        </div>

        <div className="list">
          <div className="list-row">
            <span className="stat-ico" style={{ background: '#f8ebee', color: '#7a1730' }}>
              <Database size={15} />
            </span>
            <div className="list-main">
              <div className="list-title">সংরক্ষিত তথ্য</div>
              <div className="list-sub">
                {data.contributions.length} টি আদায় ও {data.expenses.length} টি খরচের এন্ট্রি
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-sm" onClick={exportJson}>
            <Download size={14} /> ব্যাকআপ ডাউনলোড
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> ব্যাকআপ থেকে ফেরান
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImport(file);
              event.target.value = '';
            }}
          />
        </div>

        <div className="form-error" style={{ background: '#fdf6ee', color: '#8a5f13', marginTop: 18 }}>
          টিপস: বিয়ের আগে ও পরে ব্যাকআপ ফাইল নামিয়ে রাখুন। ব্রাউজারের ডেটা মুছে গেলে এই ফাইল থেকেই
          হিসাব ফিরিয়ে আনা যাবে।
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            className="btn btn-sm btn-gold"
            onClick={() => {
              if (!window.confirm('নমুনা হিসাব লোড করলে বর্তমান সব এন্ট্রি মুছে যাবে। চালিয়ে যাবেন?')) return;
              resetToDemo();
              notify('নমুনা হিসাব লোড হয়েছে');
            }}
          >
            <RefreshCw size={14} /> নমুনা হিসাব লোড
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (!window.confirm('সব আদায় ও খরচের এন্ট্রি মুছে ফেলবেন? এটি ফিরিয়ে আনা যাবে না।')) return;
              clearAll();
              notify('সব এন্ট্রি মুছে ফেলা হয়েছে');
            }}
          >
            <Trash2 size={14} /> সব হিসাব মুছুন
          </button>
        </div>

        <p className="muted small" style={{ marginTop: 18 }}>
          অ্যাপটি সম্পূর্ণ আপনার ব্রাউজারে চলে — কোনো তথ্য ইন্টারনেটে পাঠানো হয় না। একাধিক ডিভাইসে
          হিসাব দেখতে চাইলে নিচের শেয়ার কোড বা ব্যাকআপ ফাইল ব্যবহার করুন।
        </p>
      </div>

      <ShareData />
    </div>
  );
}
