import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: 'var(--primary)' }} />;
}

export function Card({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div onClick={onClick} style={style} className={`surface rounded-2xl ${onClick ? 'hover-lift cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--primary)' }}>{eyebrow}</div>}
      <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

export function ScoreRing({ score, size = 120, label, color }: { score: number; size?: number; label?: string; color?: string }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const col = color ?? (score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : 'var(--danger)');
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#243329" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold">{Math.round(score)}</span>
        {label && <span className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted)' }}>{label}</span>}
      </div>
    </div>
  );
}

export function Bar({ value, max, color, label, valueLabel }: { value: number; max: number; color?: string; label?: string; valueLabel?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--muted)' }}>{label}</span>
          <span style={{ color: 'var(--text)' }}>{valueLabel ?? `${Math.round(value)}g`}</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#243329' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color ?? 'var(--primary)', transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </div>
    </div>
  );
}

export function StatusPill({ status, children }: { status: 'good' | 'fair' | 'poor'; children: ReactNode }) {
  const map = {
    good: { bg: 'rgba(111,191,115,0.12)', color: 'var(--success)', border: 'rgba(111,191,115,0.3)' },
    fair: { bg: 'rgba(240,169,59,0.12)', color: 'var(--warning)', border: 'rgba(240,169,59,0.3)' },
    poor: { bg: 'rgba(232,93,93,0.12)', color: 'var(--danger)', border: 'rgba(232,93,93,0.3)' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{icon}</div>
      <p className="font-display text-lg">{title}</p>
      {sub && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  );
}

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in" style={{ background: 'rgba(6,10,8,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="surface rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto anim-scale-in" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b hairline">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="btn-ghost rounded-lg w-8 h-8 flex items-center justify-center text-sm">×</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
