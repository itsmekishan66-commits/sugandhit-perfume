import type { ReactNode } from 'react';
import GhostBtn from '@/components/ui/GhostBtn';
import Modal from './Modal';

const ConfirmDialog = ({
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

export default ConfirmDialog;