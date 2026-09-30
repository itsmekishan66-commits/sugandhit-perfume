import type { ReactNode } from 'react';

const GhostBtn = ({
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

export default GhostBtn;