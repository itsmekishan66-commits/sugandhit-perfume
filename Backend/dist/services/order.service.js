import { desc, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { orders, users } from '../models/schema.js';
import { serializeOrder } from '../utils/helper.js';
const buildOrderData = ({ userId, items, amount, address }) => ({
    userId: Number(userId),
    items,
    address,
    amount,
    paymentMethod: 'COD',
    payment: false,
    date: Date.now(),
});
export const placeOrder = async (data) => {
    await db.insert(orders).values(buildOrderData(data));
    await db.update(users).set({ cartData: {} }).where(eq(users.id, Number(data.userId)));
};
export const listAllOrders = async () => {
    const all = await db.select().from(orders).orderBy(desc(orders.date));
    return all.map(serializeOrder);
};
export const listUserOrders = async (userId) => {
    const all = await db.select().from(orders).where(eq(orders.userId, Number(userId))).orderBy(desc(orders.date));
    return all.map(serializeOrder);
};
export const updateOrderStatus = async (orderId, status) => {
    await db.update(orders).set({ status }).where(eq(orders.id, Number(orderId)));
};
