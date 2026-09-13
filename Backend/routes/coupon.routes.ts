import express from 'express';
import { list, adminList, create, update, toggle, remove } from '../controllers/coupon.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';
import upload from '../middleware/multer.middleware.js';
import { validate, couponSchema, couponUpdateSchema, couponIdSchema, couponToggleSchema } from '../validate/index.js';

const couponRouter = express.Router();

couponRouter.get('/list', list);
couponRouter.post('/admin/list', adminAuth, adminList);
couponRouter.post('/create', adminAuth, upload.single('image'), validate(couponSchema), create);
couponRouter.post('/update', adminAuth, upload.single('image'), validate(couponUpdateSchema), update);
couponRouter.post('/toggle', adminAuth, validate(couponToggleSchema), toggle);
couponRouter.post('/delete', adminAuth, validate(couponIdSchema), remove);

export default couponRouter;