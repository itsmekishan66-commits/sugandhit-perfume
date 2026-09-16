import { products } from '../../database/schema/index.js';

export const serializeProduct = (p: typeof products.$inferSelect) => ({
  ...p,
  _id: String(p.id),
  price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
  rating: p.rating != null ? Number(p.rating) : 0,
  reviews: p.reviews ?? 0,
  variants: p.colors || [],
});