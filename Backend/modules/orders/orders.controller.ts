import type { Request, Response } from 'express';
import {
  placeOrder,
  listAllOrders,
  listUserOrders,
  updateOrderStatus,
  placeCustomOrder,
  listUserCustomOrders,
  listAllCustomOrders,
  updateCustomOrderStatus,
} from './orders.service.js';
import { ok, fail } from '../../shared/utils/response.js';

export const place = async (req: Request, res: Response) => {
  try {
    const { userId, items, amount, address } = req.body;
    await placeOrder({ userId, items, amount, address });
    ok(res, {}, 'Order Placed');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const placeOrderKhalti = async (_req: Request, res: Response) => {
  fail(res, 'Khalti not configured yet');
};

export const placeOrderEsewa = async (_req: Request, res: Response) => {
  fail(res, 'eSewa not configured yet');
};

export const listAllOrdersController = async (_req: Request, res: Response) => {
  try {
    const orders = await listAllOrders();
    ok(res, { orders });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const listUserOrdersController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const orders = await listUserOrders(Number(userId));
    ok(res, { orders });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    await updateOrderStatus(orderId, status);
    ok(res, {}, 'Status Updated');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const placeCustomOrderController = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      name,
      bottleSize,
      topNotes,
      heartNotes,
      baseNotes,
      perfumeBase,
      strength,
      strengthName,
      customLabel,
      amount,
      address,
    } = req.body;

    await placeCustomOrder({
      userId,
      name,
      bottleSize,
      topNotes,
      heartNotes,
      baseNotes,
      perfumeBase,
      strength,
      strengthName,
      customLabel,
      amount,
      address,
    });

    ok(res, {}, 'Custom Perfume Order Placed!');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const listUserCustomOrdersController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const orders = await listUserCustomOrders(Number(userId));
    ok(res, { orders });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const listAllCustomOrdersController = async (_req: Request, res: Response) => {
  try {
    const orders = await listAllCustomOrders();
    ok(res, { orders });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const updateCustomOrderStatusController = async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;
    await updateCustomOrderStatus(orderId, status);
    ok(res, {}, 'Status Updated');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};
