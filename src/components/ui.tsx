import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <div className="card-sub">{subtitle}</div> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={18} />
          </button>
        </div>
        {children}
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ProgressRing({
  value,
  size = 138,
  stroke = 11,
  color = '#f2d49b',
  track = 'rgba(255, 255, 255, 0.16)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = '#7a1730',
  accentSoft = '#f8ebee',
  foot,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: string;
  accentSoft?: string;
  foot?: ReactNode;
}) {
  return (
    <div className="stat" style={{ '--accent': accent, '--accent-soft': accentSoft } as CSSProperties}>
      <div className="stat-top">
        <span className="stat-ico">{icon}</span>
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {foot ? <div className="stat-foot">{foot}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  note,
  action,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div>{icon}</div>
      <h4>{title}</h4>
      <p>{note}</p>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  span,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field${span ? ' span-2' : ''}`}>
      <label>
        <span className="field-label">{label}</span>
        {children}
      </label>
      {error ? <span className="error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function AmountText({ value, sign = 'in' }: { value: string; sign?: 'in' | 'out' }) {
  return <span className={sign === 'in' ? 'amount-in' : 'amount-out'}>{value}</span>;
}
