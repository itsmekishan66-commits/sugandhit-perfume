import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import upload from '../../middleware/upload.middleware.js';
import { listCoupons, listAdminCoupons, createCoupon, updateCoupon, toggleCoupon, removeCoupon } from './coupons.controller.js';
import { validate, couponSchema, couponUpdateSchema, couponIdSchema, couponToggleSchema } from './coupons.validation.js';

const router = Router();

router.get('/list', listCoupons);
router.post('/admin/list', adminAuth, listAdminCoupons);
router.post('/create', adminAuth, upload.single('image'), validate(couponSchema), createCoupon);
router.post('/update', adminAuth, upload.single('image'), validate(couponUpdateSchema), updateCoupon);
router.post('/toggle', adminAuth, validate(couponToggleSchema), toggleCoupon);
router.post('/delete', adminAuth, validate(couponIdSchema), removeCoupon);

export default router;
