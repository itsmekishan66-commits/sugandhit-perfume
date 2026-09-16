import type { Response } from 'express';

export const ok = <T>(res: Response, data: T, message?: string) => {
  res.json({
    success: true,
    ...(message ? { message } : {}),
    ...(data instanceof Object ? data : { data }),
  });
};

export const created = <T>(res: Response, data: T, message?: string) => {
  res.json({
    success: true,
    ...(message ? { message } : {}),
    ...(data instanceof Object ? data : { data }),
  });
};

export const fail = (res: Response, message: string, code?: string) => {
  res.json({ success: false, message, ...(code ? { code } : {}) });
};

export const notFound = (res: Response, message = 'Not found') => {
  res.status(404).json({ success: false, message });
};