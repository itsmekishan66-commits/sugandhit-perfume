import { currency } from '../config';

export const money = (value: number | string | null | undefined, decimals = 2): string => {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return `${currency} 0`;
  return `${currency} ${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const num = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
};

export const formatDate = (date: string | number | null | undefined): string => {
  if (!date) return '—';
  const d = new Date(Number(date));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date: string | number | null | undefined): string => {
  if (!date) return '—';
  const d = new Date(Number(date));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const label = (map: Record<string, string>, value: string | null | undefined, fallback = '—'): string =>
  (value && map[value]) || fallback;