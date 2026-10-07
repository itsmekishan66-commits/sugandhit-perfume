import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import { orders, customorders } from '../../database/schema/index.js';
import { serializeOrder, serializeCustomOrder } from './orders.utils.js';
import type { SerializedOrder, SerializedCustomOrder, OrderListFilters, CustomOrderListFilters } from './orders.types.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

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

const buildOrderWhere = (filters: OrderListFilters = {}) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        sql`${orders.id}::text ilike ${q}`,
        sql`${orders.amount}::text ilike ${q}`,
        ilike(orders.paymentMethod, q),
        ilike(orders.status, q),
        sql`${orders.items}::text ilike ${q}`,
        sql`${orders.address}::text ilike ${q}`
      )
    );
  }
  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.paymentMethod) conditions.push(eq(orders.paymentMethod, filters.paymentMethod));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const listAllOrdersRepo = async (
  opts?: { limit?: number; offset?: number } & OrderListFilters
): Promise<SerializedOrder[]> => {
  const where = buildOrderWhere(opts);
  const query = db.select().from(orders).where(where ?? sql`1=1`).orderBy(desc(orders.date));
  const all = opts ? await query.limit(opts.limit ?? 50).offset(opts.offset ?? 0) : await query;
  return all.map(serializeOrder);
};

export const countOrders = async (filters: OrderListFilters = {}) => {
  const where = buildOrderWhere(filters);
  const counts = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where ?? sql`1=1`);
  return Number(counts[0]?.count ?? 0);
};

export const listDistinctOrderStatuses = async () => {
  const rows = await db.selectDistinct({ status: orders.status }).from(orders).orderBy(asc(orders.status));
  return rows.map((r) => r.status).filter(Boolean);
};

export const listDistinctPaymentMethods = async () => {
  const rows = await db.selectDistinct({ paymentMethod: orders.paymentMethod }).from(orders).orderBy(asc(orders.paymentMethod));
  return rows.map((r) => r.paymentMethod).filter(Boolean);
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
  bottleType: string;
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
    bottleType: data.bottleType,
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

const buildCustomOrderWhere = (filters: CustomOrderListFilters = {}) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        sql`${customorders.id}::text ilike ${q}`,
        ilike(customorders.name, q),
        ilike(customorders.bottleSize, q),
        ilike(customorders.bottleType, q),
        ilike(customorders.perfumeBase, q),
        ilike(customorders.strength, q),
        ilike(customorders.strengthName, q),
        ilike(customorders.customLabel, q),
        ilike(customorders.paymentMethod, q),
        ilike(customorders.status, q),
        sql`${customorders.amount}::text ilike ${q}`,
        sql`${customorders.topNotes}::text ilike ${q}`,
        sql`${customorders.heartNotes}::text ilike ${q}`,
        sql`${customorders.baseNotes}::text ilike ${q}`,
        sql`${customorders.address}::text ilike ${q}`
      )
    );
  }
  if (filters.status) conditions.push(eq(customorders.status, filters.status));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const listAllCustomOrdersRepo = async (
  opts?: { limit?: number; offset?: number } & CustomOrderListFilters
): Promise<SerializedCustomOrder[]> => {
  const where = buildCustomOrderWhere(opts);
  const query = db.select().from(customorders).where(where ?? sql`1=1`).orderBy(desc(customorders.date));
  const all = opts ? await query.limit(opts.limit ?? 50).offset(opts.offset ?? 0) : await query;
  return all.map(serializeCustomOrder);
};

export const countCustomOrders = async (filters: CustomOrderListFilters = {}) => {
  const where = buildCustomOrderWhere(filters);
  const counts = await db.select({ count: sql<number>`count(*)` }).from(customorders).where(where ?? sql`1=1`);
  return Number(counts[0]?.count ?? 0);
};

export const listDistinctCustomOrderStatuses = async () => {
  const rows = await db
    .selectDistinct({ status: customorders.status })
    .from(customorders)
    .orderBy(asc(customorders.status));
  return rows.map((r) => r.status).filter(Boolean);
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