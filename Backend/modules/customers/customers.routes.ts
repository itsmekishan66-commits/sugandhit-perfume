import express from 'express';
import {
  receivableList,
  receivableAgingReport,
  receivableStatement,
  receivableAdjust,
  cartAdd,
  cartUpdate,
  cartGet,
  wishlistGet,
  wishlistAdd,
  wishlistRemove,
} from './customers.controller.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import authUser from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import {
  receivableAdjustSchema,
  cartAddSchema,
  cartUpdateSchema,
  wishlistSchema,
  userIdSchema,
} from './customers.validation.js';

const customersRouter = express.Router();

customersRouter.use(loadAdmin);

customersRouter.get('/receivables', requireAdmin(PERMISSIONS.receivables_view), receivableList);
customersRouter.get('/receivables/aging', requireAdmin(PERMISSIONS.receivables_view), receivableAgingReport);
customersRouter.get('/receivables/statement/:customerId', requireAdmin(PERMISSIONS.receivables_view), receivableStatement);
customersRouter.post('/receivables/adjust', requireAdmin(PERMISSIONS.receivables_manage), validate(receivableAdjustSchema), receivableAdjust);

customersRouter.post('/cart/get', authUser, validate(userIdSchema), cartGet);
customersRouter.post('/cart/add', authUser, validate(cartAddSchema), cartAdd);
customersRouter.post('/cart/update', authUser, validate(cartUpdateSchema), cartUpdate);

customersRouter.post('/wishlist/get', authUser, validate(userIdSchema), wishlistGet);
customersRouter.post('/wishlist/add', authUser, validate(wishlistSchema), wishlistAdd);
customersRouter.post('/wishlist/remove', authUser, validate(wishlistSchema), wishlistRemove);

export default customersRouter;