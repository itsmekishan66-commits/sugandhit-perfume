"use client";

import { useEffect } from "react";

interface PaginationProps {
  total: number;
  perPage: number;
  page: number;
  onPage: (p: number) => void;
  label?: string;
}

export default function Pagination({ total, perPage, page, onPage, label }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Keep the current page valid when the total shrinks (delete, filter, tab switch).
  useEffect(() => {
    if (page > totalPages) onPage(totalPages);
    if (page < 1) onPage(1);
  }, [page, totalPages, onPage]);

  // Nothing to page through — hide the pager entirely.
  if (total < 1) return null;

  const windowStart = Math.floor((page - 1) / 10) * 10 + 1;
  const windowEnd = Math.min(totalPages, windowStart + 9);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 mt-4 border-t border-gold/15">
      {label && <p className="text-sm text-ink-soft">{label} ({total})</p>}
      {!label && <p className="text-sm text-ink-soft">Page {page} of {totalPages} ({total} items)</p>}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-espresso border border-gold/25 bg-white/70 hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
        >
          <span aria-hidden="true">←</span> Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-9.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors border ${
              p === page
                ? "bg-gold text-ink border-gold"
                : "text-ink-soft border-gold/25 bg-white/70 hover:text-espresso hover:border-gold"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-espresso border border-gold/25 bg-white/70 hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-colors"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}