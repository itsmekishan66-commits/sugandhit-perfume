import type { ReactNode } from 'react';

const Td = ({ children, className = '', right, grow }: { children?: ReactNode; className?: string; right?: boolean; grow?: boolean }) => (
  <td className={`p-3 border-b border-gold/10 align-top ${right ? 'text-right' : 'text-left'} ${grow ? 'w-full' : ''} ${className}`}>{children}</td>
);

export default Td;