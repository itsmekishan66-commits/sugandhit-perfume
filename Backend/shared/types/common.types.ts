export type EntityId = string | number;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DateRange {
  from?: number;
  to?: number;
}

export const toNum = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  return Math.round(Number(value) * 100) / 100;
};

export interface Money {
  amount: number;
  debit?: boolean;
}