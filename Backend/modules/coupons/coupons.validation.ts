import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const anyId = z.union([z.string(), z.number()]).transform(Number);
const requiredText = (message: string) => z.string().trim().min(1, message);

const couponCodeSchema = requiredText('Coupon code is required.')
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]+$/, 'Code can only contain letters, numbers, dashes and underscores.');
const couponValueSchema = z.coerce.number().positive('Discount value must be positive.');
const epochNumber = (message: string) => z.coerce.number().min(1, message);

export const couponSchema = z.object({
  code: couponCodeSchema,
  title: requiredText('Coupon title is required.'),
  description: z.string().trim().optional().default(''),
  image: z.string().trim().optional().default(''),
  discountType: z.enum(['percent', 'flat'], { message: 'Invalid discount type.' }),
  discountValue: couponValueSchema,
  minPurchase: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).nullable().optional(),
  validTill: epochNumber('Valid till date is required.'),
});

export const couponUpdateSchema = couponSchema.extend({
  id: anyId,
  code: couponCodeSchema.optional(),
  title: requiredText('Coupon title is required.').optional(),
  discountType: z.enum(['percent', 'flat'], { message: 'Invalid discount type.' }).optional(),
  discountValue: couponValueSchema.optional(),
  validTill: epochNumber('Valid till date is required.').optional(),
});

export const couponIdSchema = z.object({ id: anyId });
export const couponToggleSchema = z.object({ id: anyId, active: z.boolean() });

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
