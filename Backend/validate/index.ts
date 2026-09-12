import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

const anyId = z.union([z.string(), z.number()]).transform(Number);
const phoneSchema = z.string().trim().regex(/^[0-9]{10,15}$/, 'Please enter a valid phone number.');
const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: 'Please enter a valid email address.' }));
const requiredText = (message: string) => z.string().trim().min(1, message);

export const userIdSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
});

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

export const orderAddressSchema = z.object({
  firstName: requiredText('First name is required.'),
  lastName: requiredText('Last name is required.'),
  email: emailSchema,
  location: requiredText('Street / Location is required.'),
  city: requiredText('City is required.'),
  district: requiredText('District is required.'),
  phone: phoneSchema,
});

export const orderPlaceSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
  items: z.array(z.record(z.string(), z.unknown())).min(1, 'Your cart is empty.'),
  amount: z.union([z.string(), z.number()]),
  address: orderAddressSchema,
});

const ORDER_STATUSES = ['Order Placed', 'Packing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'] as const;

export const orderStatusSchema = z.object({
  orderId: anyId,
  status: z.enum(ORDER_STATUSES, { message: 'Invalid order status.' }),
});

export const customAddressSchema = z.object({
  name: requiredText('Full name is required.'),
  phone: phoneSchema,
  address: requiredText('Delivery address is required.'),
  city: z.string().trim().optional(),
});

const noteLayerSchema = z
  .array(z.record(z.string(), z.unknown()))
  .min(1, 'Please select at least one note for every layer.');

export const customOrderPlaceSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
  name: z.string().trim().min(1).max(24, 'Custom blend name must be under 24 characters.'),
  bottleSize: z.enum(['30ml', '50ml', '100ml'], {
    message: 'Invalid bottle size.',
  }),
  topNotes: noteLayerSchema,
  heartNotes: noteLayerSchema,
  baseNotes: noteLayerSchema,
  perfumeBase: requiredText('Please choose your perfume base.'),
  strength: z.string().trim().optional(),
  strengthName: z.string().trim().optional(),
  customLabel: z.string().max(24, 'Custom label must be under 24 characters.').optional(),
  amount: z.union([z.string(), z.number()]),
  address: customAddressSchema,
});

const cartBaseFields = {
  userId: z.number().int().positive('Invalid user.'),
  itemId: z.union([z.string(), z.number()]),
  colors: requiredText('Please select a product option.'),
};

export const cartAddSchema = z.object({ ...cartBaseFields, quantity: z.number().int().min(1).optional() });
export const cartUpdateSchema = z.object({ ...cartBaseFields, quantity: z.number().int().min(0) });

export const wishlistSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
  productId: z.union([z.string(), z.number()]),
});

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
  bestseller: z
    .union([z.literal('true'), z.literal('false')])
    .transform((value) => value === 'true'),
});

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