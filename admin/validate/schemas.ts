import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: 'Please enter a valid email address.' }));

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password.'),
});

export const productAddSchema = z.object({
  name: z.string().trim().min(1, 'Perfume name is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
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

export const productIdSchema = z.object({
  id: z.union([z.string(), z.number()]),
});

export const orderStatusSchema = z.object({
  orderId: z.union([z.string(), z.number()]),
  status: z.enum(
    ['Order Placed', 'Packing', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'],
    { message: 'Invalid order status.' }
  ),
});

export const couponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required.').toUpperCase(),
  title: z.string().trim().min(1, 'Coupon title is required.'),
  description: z.string().optional(),
  discountType: z.enum(['percent', 'flat'], { message: 'Invalid discount type.' }),
  discountValue: z.coerce.number().positive('Discount value must be positive.'),
  minPurchase: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  validTill: z.coerce.number().min(1, 'Valid till date is required.'),
});

export const couponIdSchema = z.object({
  id: z.union([z.string(), z.number()]),
});

export const couponToggleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  active: z.boolean(),
});

export const notificationSchema = z.object({
  type: z.enum(['order', 'promo', 'sale', 'system'], { message: 'Invalid notification type.' }),
  title: z.string().trim().min(1, 'Notification title is required.'),
  message: z.string().trim().min(1, 'Notification message is required.'),
  link: z.string().trim().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export const notificationIdSchema = z.object({
  id: z.union([z.string(), z.number()]),
});