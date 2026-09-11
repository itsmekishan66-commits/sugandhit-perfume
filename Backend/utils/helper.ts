import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { users, products, orders, customorders } from '../models/schema/index.js';

export const createToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string);
};

export const createAdminToken = (email: string, password: string) => {
  return jwt.sign(email + password, process.env.JWT_SECRET as string);
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const serializeUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  address: u.address || {},
  createdAt: u.createdAt,
});

export const serializeProduct = (p: typeof products.$inferSelect) => ({
  ...p,
  _id: String(p.id),
  price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
  rating: p.rating != null ? Number(p.rating) : 0,
  reviews: p.reviews ?? 0,
});

export const serializeOrder = (o: typeof orders.$inferSelect) => ({
  ...o,
  _id: String(o.id),
  amount: typeof o.amount === 'string' ? parseFloat(o.amount) : o.amount,
});

export const serializeCustomOrder = (o: typeof customorders.$inferSelect) => ({
  ...o,
  _id: String(o.id),
  amount: typeof o.amount === 'string' ? parseFloat(o.amount) : o.amount,
});