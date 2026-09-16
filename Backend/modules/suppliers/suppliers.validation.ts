import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const anyId = z.union([z.string(), z.number()]).transform(Number);

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required.'),
  email: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

export const supplierUpdateSchema = supplierCreateSchema.partial().extend({ id: anyId });

export const supplierIdSchema = z.object({ id: anyId });

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
