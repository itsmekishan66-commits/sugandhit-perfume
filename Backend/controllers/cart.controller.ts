import type { Request, Response } from 'express';
import { addToCart, updateCart, getCart } from '../services/cart.service.js';

export const add = async (req: Request, res: Response) => {
  try {
    const { userId, itemId, colors, quantity } = req.body;
    await addToCart(Number(userId), itemId, colors, Number(quantity) || 1);
    res.json({ success: true, message: 'Added to Cart.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { userId, itemId, colors, quantity } = req.body;
    await updateCart(Number(userId), itemId, colors, Number(quantity));
    res.json({ success: true, message: 'Cart updated.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const getUserCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const cartData = await getCart(Number(userId));
    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};