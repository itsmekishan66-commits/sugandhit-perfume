import type { Request, Response } from 'express';
import {
  listCoupons,
  listAllCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  uploadCouponImage,
} from '../services/coupon.service.js';

export const list = async (_req: Request, res: Response) => {
  try {
    const coupons = await listCoupons();
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const adminList = async (_req: Request, res: Response) => {
  try {
    const coupons = await listAllCoupons();
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { code, title, description, image, discountType, discountValue, minPurchase, maxDiscount, validTill } = req.body;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const imageUrl = file ? await uploadCouponImage(file) : (image || '');
    await createCoupon({ code, title, description, image: imageUrl, discountType, discountValue, minPurchase, maxDiscount, validTill });
    res.json({ success: true, message: 'Coupon created.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id, image, ...data } = req.body;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const imageUrl = file ? await uploadCouponImage(file) : image;
    await updateCoupon(Number(id), { ...data, ...(imageUrl !== undefined ? { image: imageUrl } : {}) });
    res.json({ success: true, message: 'Coupon updated.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const toggle = async (req: Request, res: Response) => {
  try {
    const { id, active } = req.body;
    await toggleCoupon(Number(id), active);
    res.json({ success: true, message: active ? 'Coupon activated.' : 'Coupon deactivated.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await deleteCoupon(Number(id));
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};