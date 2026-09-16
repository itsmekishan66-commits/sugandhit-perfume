import { and, asc, eq, gte, lte } from 'drizzle-orm';
import db from '../../database/client.js';
import { coupons } from '../../database/schema/index.js';
import { serializeCoupon } from './coupons.utils.js';

export const findActiveCoupons = async () => {
  const now = Date.now();
  const rows = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.active, true), lte(coupons.validFrom, now), gte(coupons.validTill, now)))
    .orderBy(asc(coupons.validTill));
  return rows.map(serializeCoupon);
};

export const findAllCoupons = async () => {
  const rows = await db.select().from(coupons).orderBy(asc(coupons.validTill));
  return rows.map(serializeCoupon);
};

export const insertCoupon = async (data: {
  code: string;
  title: string;
  description: string;
  image: string;
  discountType: string;
  discountValue: string;
  minPurchase: string;
  maxDiscount: string | null;
  validFrom: number;
  validTill: number;
  active: boolean;
  createdAt: number;
}) => {
  await db.insert(coupons).values(data);
};

export const updateCouponById = async (id: number, updates: Record<string, unknown>) => {
  if (Object.keys(updates).length === 0) return;
  await db.update(coupons).set(updates).where(eq(coupons.id, id));
};

export const toggleCouponById = async (id: number, active: boolean) => {
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
};

export const deleteCouponById = async (id: number) => {
  await db.delete(coupons).where(eq(coupons.id, id));
};
