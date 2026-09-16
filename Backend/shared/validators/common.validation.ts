import { z } from 'zod';

export const anyId = z.union([z.string(), z.number()]).transform(Number);
export const phoneSchema = z.string().trim().regex(/^[0-9]{10,15}$/, 'Please enter a valid phone number.');
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: 'Please enter a valid email address.' }));
export const requiredText = (message: string) => z.string().trim().min(1, message);
export const epochNumber = (message: string) => z.coerce.number().min(1, message);
export const dateRangeSchema = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});