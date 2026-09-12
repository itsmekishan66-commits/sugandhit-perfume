import type { Request, Response } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/wishlist.service.js';

export const getUserWishlist = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const wishlist = await getWishlist(Number(userId));
    res.json({ success: true, wishlist });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const add = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    await addToWishlist(Number(userId), productId);
    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    await removeFromWishlist(Number(userId), productId);
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};