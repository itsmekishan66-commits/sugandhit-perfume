import type { ReactNode } from 'react';

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