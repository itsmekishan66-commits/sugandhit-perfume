import { orders, customorders } from '../../database/schema/index.js';

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
