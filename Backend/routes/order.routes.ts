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

const orderRouter = express.Router();

orderRouter.post('/list', adminAuth, listAllOrdersController);
orderRouter.post('/status', adminAuth, updateStatus);
orderRouter.post('/place', authUser, place);
orderRouter.post('/khalti', authUser, placeOrderKhalti);
orderRouter.post('/esewa', authUser, placeOrderEsewa);
orderRouter.post('/userorders', authUser, listUserOrders);

export default orderRouter;