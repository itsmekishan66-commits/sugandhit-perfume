import { desc, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { orders } from '../models/schema/index.js';
import { clearCart } from './cart.service.js';
import { serializeOrder } from '../utils/helper.js';

interface OrderInput {
  userId: number;
  items: Record<string, unknown>[];
  amount: string;
  address: Record<string, string>;
}

const buildOrderData = ({ userId, items, amount, address }: OrderInput) => ({
  userId: Number(userId),
  items,
  address,
  amount,
  paymentMethod: 'COD',
  payment: false,
  date: Date.now(),
});

export const placeOrder = async (data: OrderInput) => {
  await db.insert(orders).values(buildOrderData(data));
  await clearCart(Number(data.userId));
};

export const listAllOrders = async () => {
  const all = await db.select().from(orders).orderBy(desc(orders.date));
  return all.map(serializeOrder);
};

export const listUserOrders = async (userId: number) => {
  const all = await db.select().from(orders).where(eq(orders.userId, Number(userId))).orderBy(desc(orders.date));
  return all.map(serializeOrder);
};

export const updateOrderStatus = async (orderId: string | number, status: string) => {
  await db.update(orders).set({ status }).where(eq(orders.id, Number(orderId)));
};