import type { ReactNode } from 'react';

const TableShell = ({ head, children }: { head: ReactNode; children: ReactNode }) => {
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

export default TableShell;