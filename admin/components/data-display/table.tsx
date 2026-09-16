import type { ReactNode } from 'react';

export const TableShell = ({ head, children }: { head: ReactNode; children: ReactNode }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="border-b border-gold/15 text-left">
            {head}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

export const Th = ({ children, className = '', right }: { children?: ReactNode; className?: string; right?: boolean }) => (
  <th className={`p-3 font-medium text-ink whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${className}`}>{children}</th>
);

export const Td = ({ children, className = '', right, grow }: { children?: ReactNode; className?: string; right?: boolean; grow?: boolean }) => (
  <td className={`p-3 border-b border-gold/10 align-top ${right ? 'text-right' : 'text-left'} ${grow ? 'w-full' : ''} ${className}`}>{children}</td>
);

export const Row = ({ children }: { children: ReactNode }) => (
  <tr className="border-b border-gold/10 hover:bg-sand/30 transition-colors">{children}</tr>
);

export const EmptyState = ({ message }: { message: string }) => {
  return <p className="text-center text-ink-soft/60 py-12">{message}</p>;
};