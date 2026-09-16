import express from 'express';
import {
  place,
  placeOrderKhalti,
  placeOrderEsewa,
  listAllOrdersController,
  listUserOrdersController,
  updateStatus,
  placeCustomOrderController,
  listUserCustomOrdersController,
  listAllCustomOrdersController,
  updateCustomOrderStatusController,
} from './orders.controller.js';
import authUser from '../../middleware/auth.middleware.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import {
  orderPlaceSchema,
  orderStatusSchema,
  customOrderPlaceSchema,
  userIdSchema,
} from './orders.validation.js';

const ordersRouter = express.Router();

ordersRouter.use(loadAdmin);

ordersRouter.post('/place', authUser, validate(orderPlaceSchema), place);
ordersRouter.post('/khalti', authUser, placeOrderKhalti);
ordersRouter.post('/esewa', authUser, placeOrderEsewa);
ordersRouter.post('/list', requireAdmin(PERMISSIONS.inventory_view), listAllOrdersController);
ordersRouter.post('/status', requireAdmin(PERMISSIONS.inventory_manage), validate(orderStatusSchema), updateStatus);
ordersRouter.post('/userorders', authUser, validate(userIdSchema), listUserOrdersController);

ordersRouter.post('/custom/place', authUser, validate(customOrderPlaceSchema), placeCustomOrderController);
ordersRouter.post('/custom/list', authUser, validate(userIdSchema), listUserCustomOrdersController);
ordersRouter.post('/custom/all', requireAdmin(PERMISSIONS.inventory_view), listAllCustomOrdersController);
ordersRouter.post('/custom/status', requireAdmin(PERMISSIONS.inventory_manage), validate(orderStatusSchema), updateCustomOrderStatusController);

export default ordersRouter;
