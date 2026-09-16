import { users } from '../../database/schema/index.js';

export const serializeUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  address: u.address || {},
  image: u.image || '',
  credit: u.credit != null ? parseFloat(String(u.credit)) : 0,
  createdAt: u.createdAt,
});