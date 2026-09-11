import { eq } from 'drizzle-orm';
import db from '../config/db.js';
import { users } from '../models/schema/index.js';

type CartData = Record<string, Record<string, number>>;

const getCartData = async (userId: number) => {
  const userData = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!userData) throw new Error('User not found');
  return { userData, cartData: { ...((userData.cartData as CartData) || {}) } };
};

export const addToCart = async (userId: number, itemId: string, colors: string) => {
  const { cartData } = await getCartData(userId);

  if (cartData[itemId]) {
    if (cartData[itemId][colors]) {
      cartData[itemId][colors] += 1;
    } else {
      cartData[itemId][colors] = 1;
    }
  } else {
    cartData[itemId] = { [colors]: 1 };
  }

  await db.update(users).set({ cartData }).where(eq(users.id, userId));
};

export const updateCart = async (userId: number, itemId: string, colors: string, quantity: number) => {
  const { cartData } = await getCartData(userId);

  if (!cartData[itemId]) cartData[itemId] = {};
  cartData[itemId][colors] = Number(quantity);

  await db.update(users).set({ cartData }).where(eq(users.id, userId));
};

export const getCart = async (userId: number) => {
  const { userData } = await getCartData(userId);
  return userData.cartData;
};