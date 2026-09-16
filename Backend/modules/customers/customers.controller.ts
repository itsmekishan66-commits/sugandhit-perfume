import type { Request, Response } from 'express';
import {
  listReceivables,
  receivableAging,
  receivableCustomerStatement,
  adjustReceivable,
  addToCart,
  updateCart,
  getCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from './customers.service.js';
import { ok, fail } from '../../shared/utils/response.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

export const receivableList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    ok(res, await listReceivables({
      from: q.from ? Number(q.from) : undefined,
      to: q.to ? Number(q.to) : undefined,
      status: q.status,
      customerId: q.customerId ? Number(q.customerId) : undefined,
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 50,
    }));
  } catch (error) {
    fail(res, (error as Error).message);
  }
};

export const receivableAgingReport = async (_req: Request, res: Response) => {
  try {
    ok(res, { data: await receivableAging() });
  } catch (error) {
    fail(res, (error as Error).message);
  }
};

export const receivableStatement = async (req: Request, res: Response) => {
  try {
    ok(res, { data: await receivableCustomerStatement(Number(req.params.customerId)) });
  } catch (error) {
    fail(res, (error as Error).message);
  }
};

export const receivableAdjust = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, mode, amount, reason } = req.body;
    await adjustReceivable(Number(id), mode, amount, reason, a.actorId, a.ip);
    ok(res, {}, mode === 'write_off' ? 'Receivable written off.' : 'Receivable adjusted.');
  } catch (error) {
    fail(res, (error as Error).message);
  }
};

export const cartAdd = async (req: Request, res: Response) => {
  try {
    const { userId, itemId, colors, quantity } = req.body;
    await addToCart(Number(userId), itemId, colors, Number(quantity) || 1);
    ok(res, {}, 'Added to Cart.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const cartUpdate = async (req: Request, res: Response) => {
  try {
    const { userId, itemId, colors, quantity } = req.body;
    await updateCart(Number(userId), itemId, colors, Number(quantity));
    ok(res, {}, 'Cart updated.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const cartGet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const cartData = await getCart(Number(userId));
    ok(res, { cartData });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const wishlistGet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const wishlist = await getWishlist(Number(userId));
    ok(res, { wishlist });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const wishlistAdd = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    await addToWishlist(Number(userId), productId);
    ok(res, {}, 'Added to wishlist.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const wishlistRemove = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;
    await removeFromWishlist(Number(userId), productId);
    ok(res, {}, 'Removed from wishlist.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};