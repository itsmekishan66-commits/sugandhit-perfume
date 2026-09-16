import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.json({ success: false, message: result.error.issues[0]?.message || 'Validation failed.' });
    }
    req.body = result.data;
    next();
  };