import { z } from 'zod';
import { requiredText, phoneSchema } from '../../shared/validators/common.validation.js';

export const userIdSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
});

export const addCreditSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
  amount: z.coerce.number().positive('Credit amount must be positive.'),
});

export const updateProfileSchema = z
  .object({
    userId: z.number().int().positive('Invalid user.'),
    name: requiredText('Please enter your full name.').optional(),
    phone: phoneSchema.optional(),
    address: z.record(z.string(), z.string()).optional(),
  })
  .refine((v) => v.name !== undefined || v.phone !== undefined || v.address !== undefined, {
    message: 'Nothing to update.',
  });