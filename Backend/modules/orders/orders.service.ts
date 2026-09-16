import db from '../../database/client.js';
import { insertOrder, findOrderById, listAllOrdersRepo, listUserOrdersRepo, updateOrderStatusRepo, insertCustomOrder, listAllCustomOrdersRepo, listUserCustomOrdersRepo, updateCustomOrderStatusRepo } from './orders.repository.js';
import { clearCart } from '../customers/customers.service.js';
import { applyStockChange } from '../inventory/inventory.repository.js';
import type { PlaceOrderInput, PlaceCustomOrderInput, OrderItem } from './orders.types.js';

const isCancellableStatus = (status: string) => /cancel|return|refund/i.test(status);

export const placeOrder = async (data: PlaceOrderInput) => {
  await db.transaction(async (tx) => {
    const order = await insertOrder(
      {
        userId: Number(data.userId),
        items: data.items,
        amount: data.amount,
        address: data.address,
      },
      tx
    );
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
  return listAllOrdersRepo();
};

export const listUserOrders = async (userId: number) => {
  return listUserOrdersRepo(userId);
};

export const updateOrderStatus = async (orderId: string | number, status: string) => {
  const order = await findOrderById(Number(orderId));
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

  await updateOrderStatusRepo(Number(orderId), status);
};

export const placeCustomOrder = async (data: PlaceCustomOrderInput) => {
  if (!data.topNotes?.length || !data.heartNotes?.length || !data.baseNotes?.length) {
    throw new Error('Please select notes for every layer.');
  }
  if (!data.perfumeBase) {
    throw new Error('Please choose your perfume base.');
  }

  await insertCustomOrder({
    userId: Number(data.userId),
    name: data.name || 'Custom Perfume',
    bottleSize: data.bottleSize || '50ml',
    topNotes: data.topNotes,
    heartNotes: data.heartNotes,
    baseNotes: data.baseNotes,
    perfumeBase: data.perfumeBase,
    strength: data.strength || 'EDP',
    strengthName: data.strengthName || 'Eau de Parfum',
    customLabel: data.customLabel || '',
    amount: data.amount,
    address: data.address,
  });
};

export const listUserCustomOrders = async (userId: number) => {
  return listUserCustomOrdersRepo(userId);
};

export const listAllCustomOrders = async () => {
  return listAllCustomOrdersRepo();
};

export const updateCustomOrderStatus = async (orderId: string | number, status: string) => {
  await updateCustomOrderStatusRepo(Number(orderId), status);
};
