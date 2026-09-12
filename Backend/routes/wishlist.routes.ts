import express from 'express';
import { getUserWishlist, add, remove } from '../controllers/wishlist.controller.js';
import authUser from '../middleware/auth.middleware.js';
import { validate, wishlistSchema, userIdSchema } from '../validate/index.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/get', authUser, validate(userIdSchema), getUserWishlist);
wishlistRouter.post('/add', authUser, validate(wishlistSchema), add);
wishlistRouter.post('/remove', authUser, validate(wishlistSchema), remove);

export default wishlistRouter;