import { coupons } from '../../database/schema/index.js';
import type { SerializedCoupon } from './coupons.types.js';

export const serializeCoupon = (c: typeof coupons.$inferSelect): SerializedCoupon => ({
  ...c,
  _id: String(c.id),
  discountValue: typeof c.discountValue === 'string' ? parseFloat(c.discountValue) : c.discountValue,
  minPurchase: typeof c.minPurchase === 'string' ? parseFloat(c.minPurchase) : c.minPurchase,
  maxDiscount:
    c.maxDiscount !== null && c.maxDiscount !== undefined
      ? typeof c.maxDiscount === 'string'
        ? parseFloat(c.maxDiscount)
        : c.maxDiscount
      : null,
});
