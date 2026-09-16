import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const anyId = z.union([z.string(), z.number()]).transform(Number);
const requiredText = (message: string) => z.string().trim().min(1, message);

export const notificationSchema = z.object({
  userId: z.number().int().positive().nullable().optional(),
  type: z.enum(['order', 'promo', 'sale', 'system'], { message: 'Invalid notification type.' }),
  title: requiredText('Notification title is required.'),
  message: requiredText('Notification message is required.'),
  link: z.string().trim().optional().default(''),
});

export const notificationIdSchema = z.object({ id: anyId });
export const notificationListSchema = z.object({ userId: z.number().int().positive().optional() });

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