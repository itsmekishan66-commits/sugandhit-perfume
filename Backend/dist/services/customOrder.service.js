import { desc, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { customorders } from '../models/schema.js';
import { serializeCustomOrder } from '../utils/helper.js';
export const placeCustomOrder = async (data) => {
    if (!data.topNotes?.length || !data.heartNotes?.length || !data.baseNotes?.length) {
        throw new Error('Please select notes for every layer.');
    }
    if (!data.perfumeBase) {
        throw new Error('Please choose your perfume base.');
    }
    await db.insert(customorders).values({
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
        paymentMethod: 'COD',
        payment: false,
        date: Date.now(),
    });
};
export const listUserCustomOrders = async (userId) => {
    const all = await db
        .select()
        .from(customorders)
        .where(eq(customorders.userId, Number(userId)))
        .orderBy(desc(customorders.date));
    return all.map(serializeCustomOrder);
};
export const listAllCustomOrders = async () => {
    const all = await db.select().from(customorders).orderBy(desc(customorders.date));
    return all.map(serializeCustomOrder);
};
export const updateCustomOrderStatus = async (orderId, status) => {
    await db.update(customorders).set({ status }).where(eq(customorders.id, Number(orderId)));
};
