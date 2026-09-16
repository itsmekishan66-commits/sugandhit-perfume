import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '../../config/constants.js';
import type { Paginated } from '../types/common.types.js';

export interface PageOptions {
  page?: number;
  limit?: number;
}

export const computePagination = (options: PageOptions = {}) => {
  const rawPage = Number(options.page) || 1;
  const rawLimit = Number(options.limit) || DEFAULT_PAGE_SIZE;
  const page = Math.max(1, rawPage);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit));
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