import { z } from 'zod';
import { requiredText, phoneSchema, emailSchema, anyId } from '../../shared/validators/common.validation.js';

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

export const userIdSchema = z.object({
  userId: z.number().int().positive('Invalid user.'),
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
