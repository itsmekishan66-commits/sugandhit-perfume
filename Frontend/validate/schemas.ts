import { z } from 'zod';

export const phoneSchema = z.string().trim().regex(/^[0-9]{10,15}$/, 'Please enter a valid phone number.');
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: 'Please enter a valid email address.' }));
export const requiredText = (message: string) => z.string().trim().min(1, message);

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

export const profileSchema = z.object({
  name: requiredText('Please enter your full name.'),
  phone: phoneSchema,
  address: requiredText('Please enter your delivery address.'),
  city: z.string().trim().optional(),
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

export const customAddressSchema = z.object({
  name: requiredText('Full name is required.'),
  phone: phoneSchema,
  address: requiredText('Delivery address is required.'),
  city: z.string().trim().optional(),
});

export const contactSchema = z.object({
  name: requiredText('Please enter your name.'),
  email: emailSchema,
  subject: requiredText('Please enter a subject.'),
  concern: requiredText('Please select a reason.'),
  message: requiredText('Please enter a message.'),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});