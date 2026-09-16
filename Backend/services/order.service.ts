import { desc, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { orders } from '../models/schema/index.js';
import { clearCart } from './cart.service.js';
import { serializeOrder } from '../utils/helper.js';
import { applyStockChange } from './inventory.service.js';

interface OrderInput {
  userId: number;
  items: Record<string, unknown>[];
  amount: string;
  address: Record<string, string>;
}

interface OrderItem {
  id?: number | string;
  name?: string;
  quantity?: number | string;
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

const isCancellableStatus = (status: string) => /cancel|return|refund/i.test(status);

export const placeOrder = async (data: OrderInput) => {
  await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values(buildOrderData(data)).returning();
    for (const item of data.items as OrderItem[]) {
      const productId = Number(item.id);
      if (!productId) continue;
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      await applyStockChange(tx, productId, -qty, 'sale', {
        referenceId: String(order.id),
        note: `Order ${String(item.name ?? '')}`.trim(),
      });
    }
  });
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
  const order = await db.query.orders.findFirst({ where: eq(orders.id, Number(orderId)) });
  if (!order) throw new Error('Order not found.');
  const nowCancelled = isCancellableStatus(status);
  const wasCancelled = isCancellableStatus(order.status);
  if (nowCancelled && !wasCancelled) {
    await db.transaction(async (tx) => {
      for (const item of (order.items ?? []) as OrderItem[]) {
        const productId = Number(item.id);
        if (!productId) continue;
        const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
        await applyStockChange(tx, productId, qty, 'sale_cancel', {
          referenceId: String(order.id),
          note: `Order ${String(item.name ?? '')} cancelled/returned`.trim(),
        });
      }
    });
  }
  await db.update(orders).set({ status }).where(eq(orders.id, Number(orderId)));
};