import { v2 as cloudinary } from 'cloudinary';
import type { CouponInput, CouponUpdateInput, SerializedCoupon } from './coupons.types.js';
import * as repo from './coupons.repository.js';

export const listCoupons = async (): Promise<SerializedCoupon[]> => {
  return repo.findActiveCoupons();
};

export const listAllCoupons = async (): Promise<SerializedCoupon[]> => {
  return repo.findAllCoupons();
};

export const uploadCouponImage = async (file: Express.Multer.File) => {
  const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
  return result.secure_url;
};

export const createCoupon = async (data: CouponInput) => {
  const now = Date.now();
  await repo.insertCoupon({
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

export const updateCoupon = async (id: number, data: CouponUpdateInput) => {
  const updates: Record<string, unknown> = {};
  if (data.code !== undefined) updates.code = data.code;
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.image !== undefined) updates.image = data.image;
  if (data.discountType !== undefined) updates.discountType = data.discountType;
  if (data.discountValue !== undefined) updates.discountValue = String(data.discountValue);
  if (data.minPurchase !== undefined) updates.minPurchase = String(data.minPurchase);
  if (data.maxDiscount !== undefined)
    updates.maxDiscount = data.maxDiscount != null ? String(data.maxDiscount) : null;
  if (data.validTill !== undefined) updates.validTill = Number(data.validTill);
  if (data.active !== undefined) updates.active = data.active;
  await repo.updateCouponById(id, updates);
};

export const toggleCoupon = async (id: number, active: boolean) => {
  await repo.toggleCouponById(id, active);
};

export const deleteCoupon = async (id: number) => {
  await repo.deleteCouponById(id);
};
