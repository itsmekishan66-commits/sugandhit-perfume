import express from 'express';
import { getUserWishlist, add, remove } from '../controllers/wishlist.controller.js';
import authUser from '../middleware/auth.middleware.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/get', authUser, getUserWishlist);
wishlistRouter.post('/add', authUser, add);
wishlistRouter.post('/remove', authUser, remove);

export default wishlistRouter;