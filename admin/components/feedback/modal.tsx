import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { GhostBtn } from '../ui/buttons';

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
    <div className="fixed inset-0 z-70 flex items-start justify-center bg-deep/60 p-4 overflow-y-auto backdrop-blur-sm">
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