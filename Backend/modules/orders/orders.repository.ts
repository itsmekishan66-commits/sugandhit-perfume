import { desc, eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { orders, customorders } from '../../database/schema/index.js';
import { serializeOrder, serializeCustomOrder } from './orders.utils.js';
import type { SerializedOrder, SerializedCustomOrder } from './orders.types.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const insertOrder = async (
  data: {
    userId: number;
    items: Record<string, unknown>[];
    amount: string;
    address: Record<string, string>;
  },
  exec: DbClient = db
) => {
  const [order] = await exec
    .insert(orders)
    .values({
      userId: data.userId,
      items: data.items,
      address: data.address,
      amount: data.amount,
      paymentMethod: 'COD',
      payment: false,
      date: Date.now(),
    })
    .returning();
  return order;
};

export const findOrderById = async (orderId: number) => {
  return db.query.orders.findFirst({ where: eq(orders.id, orderId) });
};

export const listAllOrdersRepo = async (): Promise<SerializedOrder[]> => {
  const all = await db.select().from(orders).orderBy(desc(orders.date));
  return all.map(serializeOrder);
};

export const listUserOrdersRepo = async (userId: number): Promise<SerializedOrder[]> => {
  const all = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.date));
  return all.map(serializeOrder);
};

export const updateOrderStatusRepo = async (orderId: number, status: string) => {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
};

export const insertCustomOrder = async (data: {
  userId: number;
  name: string;
  bottleSize: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  perfumeBase: string;
  strength: string;
  strengthName: string;
  customLabel: string;
  amount: string;
  address: Record<string, string>;
}) => {
  await db.insert(customorders).values({
    userId: data.userId,
    name: data.name,
    bottleSize: data.bottleSize,
    topNotes: data.topNotes,
    heartNotes: data.heartNotes,
    baseNotes: data.baseNotes,
    perfumeBase: data.perfumeBase,
    strength: data.strength,
    strengthName: data.strengthName,
    customLabel: data.customLabel,
    amount: data.amount,
    address: data.address,
    paymentMethod: 'COD',
    payment: false,
    date: Date.now(),
  });
};

export const listAllCustomOrdersRepo = async (): Promise<SerializedCustomOrder[]> => {
  const all = await db.select().from(customorders).orderBy(desc(customorders.date));
  return all.map(serializeCustomOrder);
};

export const listUserCustomOrdersRepo = async (userId: number): Promise<SerializedCustomOrder[]> => {
  const all = await db
    .select()
    .from(customorders)
    .where(eq(customorders.userId, userId))
    .orderBy(desc(customorders.date));
  return all.map(serializeCustomOrder);
};

export const updateCustomOrderStatusRepo = async (orderId: number, status: string) => {
  await db.update(customorders).set({ status }).where(eq(customorders.id, orderId));
};
