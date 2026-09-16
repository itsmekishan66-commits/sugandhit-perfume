import express from 'express';
import {
  placeCustomOrderController,
  listUserCustomOrdersController,
  listAllCustomOrdersController,
  updateCustomOrderStatusController,
} from './orders.controller.js';
import authUser from '../../middleware/auth.middleware.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import { customOrderPlaceSchema, orderStatusSchema, userIdSchema } from './orders.validation.js';

const customOrderRouter = express.Router();

customOrderRouter.use(loadAdmin);

customOrderRouter.post('/place', authUser, validate(customOrderPlaceSchema), placeCustomOrderController);
customOrderRouter.post('/userorders', authUser, validate(userIdSchema), listUserCustomOrdersController);
customOrderRouter.post('/list', requireAdmin(PERMISSIONS.inventory_view), listAllCustomOrdersController);
customOrderRouter.post('/status', requireAdmin(PERMISSIONS.inventory_manage), validate(orderStatusSchema), updateCustomOrderStatusController);

export default customOrderRouter;