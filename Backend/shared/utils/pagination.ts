import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '../../config/constants.js';
import type { Paginated } from '../types/common.types.js';

export interface PageOptions {
  page?: number;
  limit?: number;
}

export const computePagination = (options: PageOptions = {}) => {
  const rawPage = Number(options.page);
  const rawLimit = Number(options.limit);
  const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(MAX_PAGE_SIZE, Math.floor(rawLimit)) : DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildPaginated = <T>(items: T[], total: number, page: number, limit: number): Paginated<T> => {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const paginate = <T>(items: T[], options: PageOptions = {}): Paginated<T> => {
  const { page, limit, offset } = computePagination(options);
  const total = items.length;
  return buildPaginated(items.slice(offset, offset + limit), total, page, limit);
};