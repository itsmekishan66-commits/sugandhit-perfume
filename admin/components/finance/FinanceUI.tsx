import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { toneFor } from '../../utils/finance';

export const StatCard = ({
  label,
  value,
  sub,
  icon,
  tint = 'from-gold-soft to-gold',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tint?: string;
}) => {
  return (
    <div className={`flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${tint} p-5 text-[#2b1d16] shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium opacity-80">{label}</p>
        {icon && <span className="opacity-70 shrink-0">{icon}</span>}
      </div>
      <div>
        <p className="font-display text-3xl font-bold leading-tight tabular-nums truncate">{value}</p>
        {sub && <p className="mt-1 text-xs font-medium opacity-70">{sub}</p>}
      </div>
    </div>
  );
};

export const SectionCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-white/70 rounded-2xl border border-gold/15 shadow-sm backdrop-blur ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gold/15">
          <div>
            {title && <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

const TONES: Record<string, string> = {
  gold: 'bg-gold/10 text-espresso',
  green: 'bg-blush text-espresso',
  red: 'bg-espresso/10 text-espresso',
  amber: 'bg-gold/15 text-ink',
  blue: 'bg-gold/10 text-espresso',
  gray: 'bg-cream text-ink-soft',
};

export const Pill = ({ tone, children }: { tone: string; children: ReactNode }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-gold/20 px-3 py-1 text-xs font-semibold ${TONES[tone] ?? TONES.gold}`}>
      {children}
    </span>
  );
};

export const StatusPill = ({
  value,
  label: customLabel,
  tone,
}: {
  value: string | null | undefined;
  label?: string;
  tone?: string;
}) => {
  const t = tone ?? toneFor(value);
  const l = customLabel ?? value ?? '—';
  return (
    <Pill tone={t}>
      <span className={`w-1.5 h-1.5 rounded-full ${t === 'gold' || t === 'amber' ? 'bg-gold' : t === 'green' ? 'bg-espresso/70' : t === 'red' ? 'bg-espresso' : 'bg-ink-soft/40'}`} />
      <span className="capitalize">{l.replace(/_/g, ' ')}</span>
    </Pill>
  );
};

export const Tabs = ({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1 p-4 border-b border-gold/15">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            active === t.key ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream border border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export const Modal = ({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-deep/60 p-4 overflow-y-auto backdrop-blur-sm">
      <div className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} my-8 rounded-2xl bg-cream border border-gold/20 shadow-xl`}>
        <div className="flex items-center justify-between p-5 border-b border-gold/15">
          <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-white/80 text-ink-soft hover:text-espresso cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span>}
    </label>
  );
};

export const EmptyState = ({ message }: { message: string }) => {
  return <p className="text-center text-ink-soft/60 py-12">{message}</p>;
};

export const TableShell = ({ head, children }: { head: ReactNode; children: ReactNode }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="border-b border-gold/15 text-left">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export const Th = ({ children, className = '', right }: { children?: ReactNode; className?: string; right?: boolean }) => (
  <th className={`p-3 font-medium text-ink whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
);

export const Td = ({ children, className = '', right, grow }: { children?: ReactNode; className?: string; right?: boolean; grow?: boolean }) => (
  <td className={`p-3 border-b border-gold/10 align-top ${right ? 'text-right' : 'text-left'} ${grow ? 'w-full' : ''} ${className}`}>{children}</td>
);

export const Row = ({ children }: { children: ReactNode }) => (
  <tr className="border-b border-gold/10 hover:bg-sand/30 transition-colors">{children}</tr>
);

export const PrimaryBtn = ({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => (
  <button type={type} onClick={onClick} disabled={disabled} className="btn-primary px-5 py-2 text-sm disabled:opacity-50 cursor-pointer">
    {children}
  </button>
);

export const GhostBtn = ({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button type="button" onClick={onClick} className={`px-4 py-2 text-sm text-ink-soft hover:text-espresso border border-gold/20 rounded-xl hover:border-gold transition-colors cursor-pointer ${className}`}>
    {children}
  </button>
);

export const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
  busy = false,
  danger = true,
  secondaryLabel,
  onSecondary,
  secondaryDanger = true,
}: {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  danger?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDanger?: boolean;
}) => (
  <Modal open={open} title={title} onClose={onClose}>
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="flex flex-wrap justify-end gap-3">
        <GhostBtn onClick={onClose} className={busy ? 'opacity-50 pointer-events-none' : ''}>Cancel</GhostBtn>
        {onSecondary && secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            disabled={busy}
            className={`px-5 py-2 text-sm rounded-xl disabled:opacity-50 cursor-pointer ${secondaryDanger ? 'bg-espresso/10 text-espresso border border-espresso/30' : 'bg-espresso text-cream'}`}
          >
            {busy ? 'Please wait…' : secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-5 py-2 text-sm rounded-xl disabled:opacity-50 cursor-pointer ${danger ? 'bg-red-900 text-cream' : 'bg-espresso text-cream'}`}
        >
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);

export const inputCls = 'w-full px-3 py-2 rounded-xl';