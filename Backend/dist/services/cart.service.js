import { eq } from 'drizzle-orm';
import db from '../config/db.js';
import { users } from '../models/schema.js';
const getCartData = async (userId) => {
    const userData = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!userData)
        throw new Error('User not found');
    return { userData, cartData: { ...(userData.cartData || {}) } };
};
export const addToCart = async (userId, itemId, colors) => {
    const { cartData } = await getCartData(userId);
    if (cartData[itemId]) {
        if (cartData[itemId][colors]) {
            cartData[itemId][colors] += 1;
        }
        else {
            cartData[itemId][colors] = 1;
        }
    }
    else {
        cartData[itemId] = { [colors]: 1 };
    }
    await db.update(users).set({ cartData }).where(eq(users.id, userId));
};
export const updateCart = async (userId, itemId, colors, quantity) => {
    const { cartData } = await getCartData(userId);
    if (!cartData[itemId])
        cartData[itemId] = {};
    cartData[itemId][colors] = Number(quantity);
    await db.update(users).set({ cartData }).where(eq(users.id, userId));
};
export const getCart = async (userId) => {
    const { userData } = await getCartData(userId);
    return userData.cartData;
};
