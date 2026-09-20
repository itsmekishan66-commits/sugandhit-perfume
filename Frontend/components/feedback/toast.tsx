import { toast, type ToastContentProps } from 'react-toastify';
import { Check, CircleAlert, Info, X, type LucideIcon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMeta {
  icon: LucideIcon;
  iconBox: string;
  progress: string;
}

const toastMeta: Record<ToastType, ToastMeta> = {
  success: {
    icon: Check,
    iconBox: 'bg-gold text-deep',
    progress: 'from-gold via-gold-soft to-gold',
  },
  error: {
    icon: CircleAlert,
    iconBox: 'bg-red-500 text-white',
    progress: 'from-red-400 to-red-600',
  },
  info: {
    icon: Info,
    iconBox: 'bg-sand text-espresso',
    progress: 'from-sand via-gold-soft to-gold',
  },
};

export const showToast = (message: string, type: ToastType = 'success') => {
  const meta = toastMeta[type];
  const Icon = meta.icon;
  toast(
    (props: ToastContentProps) => (
      <div className="pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-gold/25 bg-ink bg-linear-to-br from-ink to-deep p-3.5 pr-3 shadow-2xl shadow-black/40">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconBox}`}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <p className="min-w-0 flex-1 font-sans text-sm leading-snug text-cream">{message}</p>
        <button
          onClick={props.closeToast}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-cream/50 transition-colors hover:bg-cream/10 hover:text-cream cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
        <span aria-hidden className={`absolute inset-x-0 bottom-0 h-0.5 bg-gold bg-linear-to-r ${meta.progress} sg-progress`} />
      </div>
    ),
    {
      autoClose: 2600,
      hideProgressBar: true,
      closeButton: false,
      closeOnClick: false,
      icon: false,
    }
  );
};