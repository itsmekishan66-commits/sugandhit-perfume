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
  listOrderFilterOptions,
  listCustomOrderFilterOptions,
} from './orders.service.js';
import { ok, fail } from '../../shared/utils/response.js';
import { hasPaginationParams } from '../../middleware/pagination.middleware.js';

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

export const listAllOrdersController = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const filters = {
      search: typeof body.search === 'string' && body.search.trim() ? body.search : undefined,
      status: typeof body.status === 'string' && body.status ? body.status : undefined,
      paymentMethod: typeof body.paymentMethod === 'string' && body.paymentMethod ? body.paymentMethod : undefined,
    };
    if (!hasPaginationParams(req)) {
      const orders = await listAllOrders();
      return ok(res, { orders });
    }
    const result = await listAllOrders({ ...req.pagination, ...filters });
    const options = await listOrderFilterOptions();
    ok(res, {
      orders: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      ...options,
    });
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

export const listAllCustomOrdersController = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const filters = {
      search: typeof body.search === 'string' && body.search.trim() ? body.search : undefined,
      status: typeof body.status === 'string' && body.status ? body.status : undefined,
    };
    if (!hasPaginationParams(req)) {
      const orders = await listAllCustomOrders();
      return ok(res, { orders });
    }
    const result = await listAllCustomOrders({ ...req.pagination, ...filters });
    const options = await listCustomOrderFilterOptions();
    ok(res, {
      orders: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      ...options,
    });
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
