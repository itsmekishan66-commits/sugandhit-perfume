import express from 'express';
import { add, update, getUserCart } from '../controllers/cart.controller.js';
import authUser from '../middleware/auth.middleware.js';

const cartRouter = express.Router();

cartRouter.post('/get', authUser, getUserCart);
cartRouter.post('/add', authUser, add);
cartRouter.post('/update', authUser, update);

export default cartRouter;