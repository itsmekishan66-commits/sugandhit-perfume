import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  accountsReceivable,
  accountsReceivablePayments,
  cartitems,
  wishlistitems,
  users,
} from '../../database/schema/index.js';
import type { ReceivableQuery } from './customers.types.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const listReceivables = async (opts: ReceivableQuery = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(accountsReceivable.invoiceDate, opts.from));
  if (opts.to) conditions.push(lte(accountsReceivable.invoiceDate, opts.to));
  if (opts.status) conditions.push(eq(accountsReceivable.status, opts.status));
  if (opts.customerId) conditions.push(eq(accountsReceivable.customerId, opts.customerId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.query.accountsReceivable.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.invoiceDate)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(accountsReceivable).where(where ?? sql`1=1`);

  return { rows, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const findReceivableById = async (id: number) =>
  db.query.accountsReceivable.findFirst({ where: eq(accountsReceivable.id, id) });

export const findCustomerById = async (customerId: number) =>
  db.query.users.findFirst({ where: eq(users.id, customerId) });

export const listReceivablePayments = async (receivableId: number) =>
  db.query.accountsReceivablePayments.findMany({
    where: eq(accountsReceivablePayments.receivableId, receivableId),
    orderBy: (t, { desc }) => [desc(t.appliedAt)],
  });

export const listByCustomer = async (customerId: number) =>
  db.query.accountsReceivable.findMany({
    where: eq(accountsReceivable.customerId, customerId),
    orderBy: (t, { asc }) => [asc(t.invoiceDate)],
  });

export const listAllReceivables = async () => db.query.accountsReceivable.findMany({});

export type ReceivablePatch = Partial<typeof accountsReceivable.$inferSelect>;

export const updateReceivable = async (id: number, patch: ReceivablePatch, exec: DbClient = db) => {
  const [updated] = await exec
    .update(accountsReceivable)
    .set(patch)
    .where(eq(accountsReceivable.id, id))
    .returning();
  return updated;
};

export const findCartItems = async (userId: number) =>
  db.query.cartitems.findMany({ where: eq(cartitems.userId, userId) });

export const upsertCartItem = async (userId: number, productId: string, size: string, quantity: number) => {
  await db
    .insert(cartitems)
    .values({ userId, productId, size, quantity: Number(quantity) })
    .onConflictDoUpdate({
      target: [cartitems.userId, cartitems.productId, cartitems.size],
      set: { quantity: sql`${cartitems.quantity} + ${Number(quantity)}` },
    });
};

export const updateCartItem = async (userId: number, productId: string, size: string, quantity: number) => {
  if (Number(quantity) <= 0) {
    await db
      .delete(cartitems)
      .where(and(eq(cartitems.userId, userId), eq(cartitems.productId, productId), eq(cartitems.size, size)));
    return;
  }
  await db
    .insert(cartitems)
    .values({ userId, productId, size, quantity: Number(quantity) })
    .onConflictDoUpdate({
      target: [cartitems.userId, cartitems.productId, cartitems.size],
      set: { quantity: Number(quantity) },
    });
};

export const deleteUserCart = async (userId: number) => {
  await db.delete(cartitems).where(eq(cartitems.userId, Number(userId)));
};

export const findWishlistItems = async (userId: number) =>
  db.query.wishlistitems.findMany({ where: eq(wishlistitems.userId, Number(userId)) });

export const insertWishlistItem = async (userId: number, productId: string) => {
  await db.insert(wishlistitems).values({ userId: Number(userId), productId }).onConflictDoNothing();
};

export const removeWishlistItem = async (userId: number, productId: string) => {
  await db
    .delete(wishlistitems)
    .where(and(eq(wishlistitems.userId, Number(userId)), eq(wishlistitems.productId, productId)));
};