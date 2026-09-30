import type { ReactNode } from 'react';

const Th = ({ children, className = '', right }: { children?: ReactNode; className?: string; right?: boolean }) => (
  <th className={`p-3 font-medium text-ink whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
);

export default Th;