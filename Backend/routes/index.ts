import express from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import productsRouter from '../modules/products/products.routes.js';
import ordersRouter from '../modules/orders/orders.routes.js';
import customOrderRouter from '../modules/orders/customOrder.routes.js';
import couponsRouter from '../modules/coupons/coupons.routes.js';
import notificationsRouter from '../modules/notifications/notifications.routes.js';
import customersRouter from '../modules/customers/customers.routes.js';
import inventoryRouter from '../modules/inventory/inventory.routes.js';
import suppliersRouter from '../modules/suppliers/suppliers.routes.js';
import paymentsRouter from '../modules/payments/payments.routes.js';
import accountingRouter from '../modules/accounting/accounting.routes.js';
import notesRouter from '../modules/notes/notes.routes.js';
import uploadsRouter from '../modules/uploads/uploads.routes.js';
import authUser from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  cartAdd,
  cartUpdate,
  cartGet,
  wishlistGet,
  wishlistAdd,
  wishlistRemove,
} from '../modules/customers/customers.controller.js';
import { cartAddSchema, cartUpdateSchema, wishlistSchema, userIdSchema } from '../modules/customers/customers.validation.js';

const cartRouter = express.Router();
cartRouter.post('/get', authUser, validate(userIdSchema), cartGet);
cartRouter.post('/add', authUser, validate(cartAddSchema), cartAdd);
cartRouter.post('/update', authUser, validate(cartUpdateSchema), cartUpdate);

const wishlistRouter = express.Router();
wishlistRouter.post('/get', authUser, validate(userIdSchema), wishlistGet);
wishlistRouter.post('/add', authUser, validate(wishlistSchema), wishlistAdd);
wishlistRouter.post('/remove', authUser, validate(wishlistSchema), wishlistRemove);

const routes = express.Router();

routes.use('/api/user', authRouter);
routes.use('/api/user', usersRouter);
routes.use('/api/product', productsRouter);
routes.use('/api/order', ordersRouter);
routes.use('/api/custom-order', customOrderRouter);
routes.use('/api/coupon', couponsRouter);
routes.use('/api/notification', notificationsRouter);
routes.use('/api/customers', customersRouter);
routes.use('/api/inventory', inventoryRouter);
routes.use('/api/suppliers', suppliersRouter);
routes.use('/api/payment', paymentsRouter);
routes.use('/api/note', notesRouter);
routes.use('/api/uploads', uploadsRouter);

routes.use('/api/cart', cartRouter);
routes.use('/api/wishlist', wishlistRouter);

routes.use('/api/accounts', usersRouter);
routes.use('/api/accounts', customersRouter);
routes.use('/api/accounts/vendors', suppliersRouter);
routes.use('/api/accounts', accountingRouter);

export default routes;