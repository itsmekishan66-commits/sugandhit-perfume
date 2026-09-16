import { z } from 'zod';
import { anyId } from '../../shared/validators/common.validation.js';

export const cartBaseFields = {
  userId: z.number().int().positive('Invalid user.'),
  itemId: z.union([z.string(), z.number()]),
  colors: z.string().trim().min(1, 'Please select a product option.'),
};

export const cartAddSchema = z.object({ ...cartBaseFields, quantity: z.number().int().min(1).optional() });
export const cartUpdateSchema = z.object({ ...cartBaseFields, quantity: z.number().int().min(0) });

export const wishlistSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
  productId: z.union([z.string(), z.number()]),
});

export const userIdSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
});

export const receivableAdjustSchema = z.object({
  id: anyId,
  mode: z.enum(['adjust', 'write_off']),
  amount: z.coerce.number().optional(),
  reason: z.string().trim().optional().default(''),
});