import { z } from 'zod';
import { requiredText, emailSchema, phoneSchema } from '../../shared/validators/common.validation.js';

export const registerSchema = z.object({
  name: requiredText('Please enter your full name.'),
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  phone: phoneSchema,
  address: requiredText('Please enter your address.'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password.'),
});