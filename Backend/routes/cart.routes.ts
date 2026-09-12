import express from 'express';
import { add, update, getUserCart } from '../controllers/cart.controller.js';
import authUser from '../middleware/auth.middleware.js';
import { validate, cartAddSchema, cartUpdateSchema, userIdSchema } from '../validate/index.js';

const cartRouter = express.Router();

cartRouter.post('/get', authUser, validate(userIdSchema), getUserCart);
cartRouter.post('/add', authUser, validate(cartAddSchema), add);
cartRouter.post('/update', authUser, validate(cartUpdateSchema), update);

export default cartRouter;