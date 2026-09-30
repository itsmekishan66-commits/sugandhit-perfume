import type { ReactNode } from 'react';

const Row = ({ children }: { children: ReactNode }) => (
  <tr className="border-b border-gold/10 hover:bg-sand/30 transition-colors">{children}</tr>
);

export default Row;