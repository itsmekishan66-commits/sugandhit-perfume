import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import db from '../config/db.js';
import { coupons } from '../models/schema/index.js';
import { serializeCoupon } from '../utils/helper.js';

export const listCoupons = async (): Promise<
  ReturnType<typeof serializeCoupon>[]
> => {
  const now = Date.now();
  const rows = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.active, true), lte(coupons.validFrom, now), gte(coupons.validTill, now)))
    .orderBy(asc(coupons.validTill));
  return rows.map(serializeCoupon);
};

export const listAllCoupons = async () => {
  const rows = await db.select().from(coupons).orderBy(asc(coupons.validTill));
  return rows.map(serializeCoupon);
};

interface CouponInput {
  code: string;
  title: string;
  description?: string;
  image?: string;
  discountType: string;
  discountValue: number | string;
  minPurchase?: number | string;
  maxDiscount?: number | string | null;
  validTill: number;
}

export const uploadCouponImage = async (file: Express.Multer.File) => {
  const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
  return result.secure_url;
};

export const createCoupon = async (data: CouponInput) => {
  const now = Date.now();
  await db.insert(coupons).values({
    code: data.code,
    title: data.title,
    description: data.description || '',
    image: data.image || '',
    discountType: data.discountType,
    discountValue: String(data.discountValue),
    minPurchase: String(data.minPurchase || 0),
    maxDiscount: data.maxDiscount != null ? String(data.maxDiscount) : null,
    validFrom: now,
    validTill: Number(data.validTill),
    active: true,
    createdAt: now,
  });
};

export const updateCoupon = async (id: number, data: Partial<CouponInput> & { active?: boolean }) => {
  const updates: Record<string, unknown> = {};
  if (data.code !== undefined) updates.code = data.code;
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.image !== undefined) updates.image = data.image;
  if (data.discountType !== undefined) updates.discountType = data.discountType;
  if (data.discountValue !== undefined) updates.discountValue = String(data.discountValue);
  if (data.minPurchase !== undefined) updates.minPurchase = String(data.minPurchase);
  if (data.maxDiscount !== undefined) updates.maxDiscount = data.maxDiscount != null ? String(data.maxDiscount) : null;
  if (data.validTill !== undefined) updates.validTill = Number(data.validTill);
  if (data.active !== undefined) updates.active = data.active;
  if (Object.keys(updates).length === 0) return;
  await db.update(coupons).set(updates).where(eq(coupons.id, id));
};

export const toggleCoupon = async (id: number, active: boolean) => {
  await db.update(coupons).set({ active }).where(eq(coupons.id, id));
};

export const deleteCoupon = async (id: number) => {
  await db.delete(coupons).where(eq(coupons.id, id));
};