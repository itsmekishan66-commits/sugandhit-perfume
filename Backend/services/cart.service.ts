import { and, eq, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { cartitems } from '../models/schema/index.js';

type CartData = Record<string, Record<string, number>>;

const isExistingUser = async (userId: number) => {
  const rows = await db.query.cartitems.findMany({ where: eq(cartitems.userId, userId) });
  return rows;
};

export const addToCart = async (userId: number, itemId: string, size: string, quantity = 1) => {
  await db
    .insert(cartitems)
    .values({ userId, productId: itemId, size, quantity: Number(quantity) })
    .onConflictDoUpdate({
      target: [cartitems.userId, cartitems.productId, cartitems.size],
      set: { quantity: sql`${cartitems.quantity} + ${Number(quantity)}` },
    });
};

export const updateCart = async (userId: number, itemId: string, size: string, quantity: number) => {
  if (Number(quantity) <= 0) {
    await db
      .delete(cartitems)
      .where(and(eq(cartitems.userId, userId), eq(cartitems.productId, itemId), eq(cartitems.size, size)));
    return;
  }
  await db
    .insert(cartitems)
    .values({ userId, productId: itemId, size, quantity: Number(quantity) })
    .onConflictDoUpdate({
      target: [cartitems.userId, cartitems.productId, cartitems.size],
      set: { quantity: Number(quantity) },
    });
};

export const getCart = async (userId: number): Promise<CartData> => {
  const rows = await isExistingUser(userId);
  const cartData: CartData = {};
  for (const row of rows) {
    cartData[row.productId] = cartData[row.productId] || {};
    cartData[row.productId][row.size] = row.quantity;
  }
  return cartData;
};

export const clearCart = async (userId: number) => {
  await db.delete(cartitems).where(eq(cartitems.userId, Number(userId)));
};