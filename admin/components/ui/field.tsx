import type { ReactNode } from 'react';

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft/70">{hint}</span>}
    </label>
  );
};