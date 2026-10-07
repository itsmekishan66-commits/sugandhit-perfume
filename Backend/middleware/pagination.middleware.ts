/* eslint-disable @typescript-eslint/no-namespace */
import type { NextFunction, Request, Response } from 'express';
import { computePagination } from '../shared/utils/pagination.js';
import type { PageOptions } from '../shared/utils/pagination.js';

export interface PaginationInfo {
  page: number;
  limit: number;
  offset: number;
}

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationInfo;
    }
  }
}

const readPageOptions = (req: Request): PageOptions => {
  const q = req.query as Record<string, unknown>;
  const b = (req.body ?? {}) as Record<string, unknown>;
  return {
    page: (q.page ?? b.page) as number | undefined,
    limit: (q.limit ?? b.limit) as number | undefined,
  };
};

/**
 * True when the client asked for pagination (page/limit present in query or body).
 * Used by list APIs that keep a legacy "return everything" mode when no pagination
 * params are supplied.
 */
export const hasPaginationParams = (req: Request): boolean => {
  const q = req.query as Record<string, unknown>;
  const b = (req.body ?? {}) as Record<string, unknown>;
  return q.page !== undefined || q.limit !== undefined || b.page !== undefined || b.limit !== undefined;
};

/**
 * Parses ?page=&limit= (query first, JSON body as fallback) and exposes
 * req.pagination = { page, limit, offset }. Defaults and the maximum page size
 * come from config/constants.ts; invalid values fall back to defaults.
 */
export const paginate = (req: Request, _res: Response, next: NextFunction) => {
  req.pagination = computePagination(readPageOptions(req));
  next();
};