import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
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
  return createPortal(
    <div className="fixed inset-0 z-70 overflow-y-auto bg-deep/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl bg-cream border border-gold/20 shadow-xl`}>
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
    </div>,
    document.body,
  );
};

export default Modal;