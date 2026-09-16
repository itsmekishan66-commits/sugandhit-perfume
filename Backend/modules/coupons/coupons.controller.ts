import type { Request, Response } from 'express';
import * as service from './coupons.service.js';

export const listCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await service.listCoupons();
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const listAdminCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await service.listAllCoupons();
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, title, description, image, discountType, discountValue, minPurchase, maxDiscount, validTill } =
      req.body;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const imageUrl = file ? await service.uploadCouponImage(file) : image || '';
    await service.createCoupon({
      code,
      title,
      description,
      image: imageUrl,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validTill,
    });
    res.json({ success: true, message: 'Coupon created.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id, image, ...data } = req.body;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const imageUrl = file ? await service.uploadCouponImage(file) : image;
    await service.updateCoupon(Number(id), { ...data, ...(imageUrl !== undefined ? { image: imageUrl } : {}) });
    res.json({ success: true, message: 'Coupon updated.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const toggleCoupon = async (req: Request, res: Response) => {
  try {
    const { id, active } = req.body;
    await service.toggleCoupon(Number(id), active);
    res.json({ success: true, message: active ? 'Coupon activated.' : 'Coupon deactivated.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const removeCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await service.deleteCoupon(Number(id));
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};
