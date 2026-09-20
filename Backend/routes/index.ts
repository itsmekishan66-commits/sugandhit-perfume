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

routes.use('/user', authRouter);
routes.use('/user', usersRouter);
routes.use('/product', productsRouter);
routes.use('/order', ordersRouter);
routes.use('/custom-order', customOrderRouter);
routes.use('/coupon', couponsRouter);
routes.use('/notification', notificationsRouter);
routes.use('/customers', customersRouter);
routes.use('/inventory', inventoryRouter);
routes.use('/suppliers', suppliersRouter);
routes.use('/payment', paymentsRouter);
routes.use('/note', notesRouter);
routes.use('/uploads', uploadsRouter);

routes.use('/cart', cartRouter);
routes.use('/wishlist', wishlistRouter);

routes.use('/accounts', usersRouter);
routes.use('/accounts', customersRouter);
routes.use('/accounts/vendors', suppliersRouter);
routes.use('/accounts', accountingRouter);

export default routes;