import { z } from 'zod';
import { requiredText } from '../../shared/validators/common.validation.js';

export const productIdSchema = z.object({ id: z.union([z.string(), z.number()]) });
export const productSingleSchema = z.object({ productId: z.union([z.string(), z.number()]) });

export const productAddSchema = z.object({
  name: requiredText('Perfume name is required.'),
  description: requiredText('Description is required.'),
  price: z.coerce.number().positive('Price must be a positive number.').transform(String),
  category: z.enum(['Men', 'Women', 'Unisex'], { message: 'Invalid category.' }),
  subCategory: z.enum(
    ['Eau de Parfum', 'Eau de Toilette', 'Attar / Oil', 'Bodyspray', 'Rollerball', 'Unisex'],
    { message: 'Invalid fragrance family.' }
  ),
  colors: z.string().optional(),
  variants: z.string().optional().default(''),
  bestseller: z
    .union([z.literal('true'), z.literal('false')])
    .transform((value) => value === 'true'),
});

export const productUpdateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: requiredText('Perfume name is required.'),
  description: requiredText('Description is required.'),
  price: z.coerce.number().positive('Price must be a positive number.').transform(String),
  category: z.enum(['Men', 'Women', 'Unisex'], { message: 'Invalid category.' }),
  subCategory: z.enum(
    ['Eau de Parfum', 'Eau de Toilette', 'Attar / Oil', 'Bodyspray', 'Rollerball', 'Unisex'],
    { message: 'Invalid fragrance family.' }
  ),
  variants: z.string().optional().default(''),
  scheme: z.string().optional().default('{}'),
  bestseller: z
    .union([z.literal('true'), z.literal('false')])
    .transform((value) => value === 'true'),
});