import type { ReactNode } from 'react';

const PrimaryBtn = ({
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

export default PrimaryBtn;