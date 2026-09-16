import { and, eq, gte, ilike, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  products,
  purchaseOrders,
  purchaseOrderLines,
  inventoryMovements,
  vendors,
  accountsPayable,
} from '../../database/schema/index.js';
import type { ApplyStockChangeOpts } from './inventory.types.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const applyStockChange = async (
  exec: DbClient,
  productId: number,
  change: number,
  type: string,
  opts: ApplyStockChangeOpts = {}
) => {
  if (!change) return null;
  const [updated] = await exec
    .update(products)
    .set({ stock: sql`${products.stock} + ${change}` })
    .where(and(eq(products.id, productId), gte(products.stock, -change)))
    .returning();
  if (!updated) throw new Error(`Insufficient stock for product #${productId}.`);
  const qtyAfter = updated.stock;
  const qtyBefore = qtyAfter - change;
  const [movement] = await exec
    .insert(inventoryMovements)
    .values({
      productId,
      change,
      type,
      referenceId: opts.referenceId ?? '',
      qtyBefore,
      qtyAfter,
      note: opts.note ?? '',
      createdBy: opts.createdBy ?? null,
      createdAt: Date.now(),
    })
    .returning();
  return { ...movement, _id: String(movement.id) };
};

export const findProductById = (id: number) =>
  db.query.products.findFirst({ where: eq(products.id, id) });

export const updateProduct = (id: number, patch: Record<string, unknown>) =>
  db.update(products).set(patch).where(eq(products.id, id));

export const deleteProductById = (id: number) =>
  db.delete(products).where(eq(products.id, id));

export const findVendorById = (id: number) =>
  db.query.vendors.findFirst({ where: eq(vendors.id, id) });

export const insertInventoryMovement = (values: Record<string, unknown>) =>
  db.insert(inventoryMovements).values(castInsert<typeof inventoryMovements.$inferInsert>(values)).returning();

export const countInventoryMovements = () =>
  db.select({ count: sql<number>`count(*)` }).from(inventoryMovements);

export const findAllProducts = (where?: ReturnType<typeof sql>) =>
  db.query.products.findMany({ where, orderBy: (t, { asc }) => [asc(t.name)] });

export const findProductsBySearch = (q: string) =>
  db.query.products.findMany({ where: ilike(products.name, `%${q}%`), columns: { id: true } });

export const findMovementsPaginated = (
  where: ReturnType<typeof sql> | undefined,
  limit: number,
  offset: number
) =>
  db.query.inventoryMovements.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    offset,
  });

export const countMovementsWhere = (where: ReturnType<typeof sql> | undefined) =>
  db.select({ count: sql<number>`count(*)` }).from(inventoryMovements).where(where ?? sql`1=1`);

export const findProductByIdForMovement = (id: number) =>
  db.query.products.findFirst({ where: eq(products.id, id) });

export const insertPurchaseOrder = (values: Record<string, unknown>) =>
  db.insert(purchaseOrders).values(castInsert<typeof purchaseOrders.$inferInsert>(values)).returning();

export const insertPurchaseOrderLines = (values: Record<string, unknown>[]) =>
  db.insert(purchaseOrderLines).values(castInsert<typeof purchaseOrderLines.$inferInsert[]>(values));

export const findPurchaseOrderById = (id: number) =>
  db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, id) });

export const findPurchaseOrdersPaginated = (
  where: ReturnType<typeof sql> | undefined,
  limit: number,
  offset: number
) =>
  db.query.purchaseOrders.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.orderDate)],
    limit,
    offset,
  });

export const countPurchaseOrdersWhere = (where: ReturnType<typeof sql> | undefined) =>
  db.select({ count: sql<number>`count(*)` }).from(purchaseOrders).where(where ?? sql`1=1`);

export const findPurchaseOrderLinesByPOId = (purchaseOrderId: number) =>
  db.query.purchaseOrderLines.findMany({ where: eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId) });

export const updatePurchaseOrderById = (id: number, patch: Record<string, unknown>) =>
  db.update(purchaseOrders).set(patch).where(eq(purchaseOrders.id, id));

export const deletePurchaseOrderLinesByPOId = (purchaseOrderId: number) =>
  db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId));

export const deletePurchaseOrderById = (id: number) =>
  db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));

export const insertAccountsPayable = (values: Record<string, unknown>) =>
  db.insert(accountsPayable).values(castInsert<typeof accountsPayable.$inferInsert>(values)).returning();

export const findVendorsBySearch = (q: string) =>
  db.query.vendors.findMany({ where: ilike(vendors.name, `%${q}%`), columns: { id: true } });

export const transaction = <T>(fn: (tx: DbClient) => Promise<T>): Promise<T> =>
  db.transaction(fn);

const castInsert = <T>(v: unknown) => v as T;
