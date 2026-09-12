import express from 'express';
import {
  place,
  placeOrderKhalti,
  placeOrderEsewa,
  listAllOrdersController,
  listUserOrders,
  updateStatus,
} from '../controllers/order.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';
import authUser from '../middleware/auth.middleware.js';
import { validate, orderPlaceSchema, orderStatusSchema, userIdSchema } from '../validate/index.js';

const orderRouter = express.Router();

orderRouter.post('/list', adminAuth, listAllOrdersController);
orderRouter.post('/status', adminAuth, validate(orderStatusSchema), updateStatus);
orderRouter.post('/place', authUser, validate(orderPlaceSchema), place);
orderRouter.post('/khalti', authUser, placeOrderKhalti);
orderRouter.post('/esewa', authUser, placeOrderEsewa);
orderRouter.post('/userorders', authUser, validate(userIdSchema), listUserOrders);

export default orderRouter;