import { and, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { products, purchaseOrders, purchaseOrderLines, inventoryMovements, vendors, accountsPayable } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';
import { postJournal, ensureAccountExists } from './journal.service.js';
import { toMoney, toNum } from '../utils/money.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const applyStockChange = async (
  exec: DbClient,
  productId: number,
  change: number,
  type: string,
  opts: { referenceId?: string; note?: string; createdBy?: number } = {}
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

export const updateReorderLevel = async (input: { productId: number; reorderLevel: number; actorId?: number }) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found.');
  const level = Math.max(0, Math.floor(input.reorderLevel));
  await db.update(products).set({ reorderLevel: level }).where(eq(products.id, input.productId));
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'inventory.reorder_level',
    entityType: 'product',
    entityId: input.productId,
    previousValue: { reorderLevel: product.reorderLevel ?? 0 },
    newValue: { reorderLevel: level },
  });
  return { ...product, reorderLevel: level, _id: String(product.id) };
};

export const updateProductInfo = async (input: {
  productId: number;
  name?: string;
  sku?: string;
  price?: number;
  cost?: number;
  reorderLevel?: number;
  actorId?: number;
}) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found.');
  const patch: Partial<typeof product> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.sku !== undefined) patch.sku = input.sku.trim();
  if (input.reorderLevel !== undefined) patch.reorderLevel = Math.max(0, Math.floor(input.reorderLevel));
  if (input.price !== undefined) {
    const price = toNum(input.price);
    if (price < 0) throw new Error('Selling price cannot be negative.');
    patch.price = toMoney(price);
  }
  if (input.cost !== undefined) {
    const cost = toNum(input.cost);
    if (cost < 0) throw new Error('Cost price cannot be negative.');
    patch.cost = toMoney(cost);
  }
  await db.update(products).set(patch).where(eq(products.id, input.productId));
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'inventory.product_update',
    entityType: 'product',
    entityId: input.productId,
    previousValue: {
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      reorderLevel: product.reorderLevel ?? 0,
    },
    newValue: patch,
  });
  return listStockItem(input.productId);
};

export const deleteProduct = async (input: { productId: number; actorId?: number }) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found.');
  await db.delete(products).where(eq(products.id, input.productId));
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'inventory.product_delete',
    entityType: 'product',
    entityId: input.productId,
    previousValue: { name: product.name },
  });
  return { id: input.productId, deleted: true };
};

const listStockItem = async (productId: number) => {
  const p = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!p) throw new Error('Product not found.');
  return {
    ...p,
    _id: String(p.id),
    price: toNum(p.price),
    cost: toNum(p.cost),
    stock: p.stock ?? 0,
    reorderLevel: p.reorderLevel ?? 0,
    lowStock: (p.stock ?? 0) <= (p.reorderLevel ?? 0),
  };
};

export const adjustStock = async (input: { productId: number; change: number; type?: string; reason?: string; actorId?: number; ip?: string }) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found.');
  const type = input.type === 'opening' ? 'opening' : 'adjustment';
  const applied = await applyStockChange(db, input.productId, Math.floor(input.change), type, {
    note: input.reason || (type === 'opening' ? 'Opening stock balance' : 'Manual stock adjustment'),
    createdBy: input.actorId,
  });
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'inventory.adjust',
    entityType: 'product',
    entityId: input.productId,
    newValue: {
      change: Math.floor(input.change),
      type,
      reason: input.reason ?? '',
      previousStock: product.stock ?? 0,
      newStock: applyStockSafe(product.stock ?? 0, input.change),
    },
    reason: input.reason,
    ip: input.ip,
  });
  return {
    productId: input.productId,
    qtyBefore: applied?.qtyBefore ?? product.stock ?? 0,
    qtyAfter: applied?.qtyAfter ?? applyStockSafe(product.stock ?? 0, input.change),
    change: Math.floor(input.change),
  };
};

const applyStockSafe = (before: number, change: number) => Math.max(0, before + Math.floor(change));

export const listStock = async (opts: { page?: number; limit?: number; search?: string; lowStock?: string } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.search?.trim()) conditions.push(ilike(products.name, `%${opts.search.trim()}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.query.products.findMany({ where, orderBy: (t, { asc }) => [asc(t.name)] });
  let items = rows.map((p) => ({
    ...p,
    _id: String(p.id),
    price: toNum(p.price),
    cost: toNum(p.cost),
    stock: p.stock ?? 0,
    reorderLevel: p.reorderLevel ?? 0,
    lowStock: (p.stock ?? 0) <= (p.reorderLevel ?? 0),
  }));
  if (opts.lowStock === 'true') items = items.filter((p) => p.lowStock);
  const total = items.length;
  return { items: items.slice((page - 1) * limit, page * limit), total, page, limit };
};

export const inventorySummary = async () => {
  const rows = await db.query.products.findMany({});
  let totalUnits = 0;
  let stockValue = 0;
  let lowStockCount = 0;
  for (const p of rows) {
    const stock = p.stock ?? 0;
    totalUnits += stock;
    stockValue += stock * toNum(p.cost);
    if (stock <= (p.reorderLevel ?? 0)) lowStockCount += 1;
  }
  const counts = await db.select({ count: sql<number>`count(*)` }).from(inventoryMovements);
  return {
    totalProducts: rows.length,
    totalUnits,
    stockValue: Math.round(stockValue * 100) / 100,
    lowStockCount,
    movementCount: Number(counts[0]?.count ?? 0),
  };
};

export const listMovements = async (opts: { page?: number; limit?: number; productId?: number; type?: string; search?: string } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.productId) conditions.push(eq(inventoryMovements.productId, opts.productId));
  if (opts.type) conditions.push(eq(inventoryMovements.type, opts.type));
  const q = opts.search?.trim();
  if (q) {
    const productRows = await db.query.products.findMany({ where: ilike(products.name, `%${q}%`), columns: { id: true } });
    const searchConditions = [ilike(inventoryMovements.referenceId, `%${q}%`), ilike(inventoryMovements.note, `%${q}%`)];
    if (productRows.length > 0) searchConditions.push(inArray(inventoryMovements.productId, productRows.map((p) => p.id)));
    conditions.push(or(...searchConditions)!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.query.inventoryMovements.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(inventoryMovements).where(where ?? sql`1=1`);
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const productMap: Record<number, (typeof products.$inferSelect) | null> = {};
  for (const id of productIds) productMap[id] = (await db.query.products.findFirst({ where: eq(products.id, id) })) ?? null;
  const items = rows.map((r) => ({
    ...r,
    _id: String(r.id),
    product: productMap[r.productId] ? { id: productMap[r.productId]!.id, name: productMap[r.productId]!.name } : null,
  }));
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export interface PurchaseOrderLineInput {
  productId: number;
  quantity: number;
  unitCost?: number;
  reorderLevel?: number;
}

export interface PurchaseOrderInput {
  supplierId: number;
  poNumber?: string;
  orderDate: number;
  expectedDate?: number;
  notes?: string;
  lines: PurchaseOrderLineInput[];
  createdBy?: number;
}

export const createPurchaseOrder = async (input: PurchaseOrderInput) => {
  const supplier = await db.query.vendors.findFirst({ where: eq(vendors.id, input.supplierId) });
  if (!supplier) throw new Error('Supplier not found.');
  if (input.lines.length === 0) throw new Error('At least one purchase line is required.');
  const now = Date.now();
  const poNumber = input.poNumber?.trim() || `PO-${now}`;
  const subTotal = Math.round(input.lines.reduce((s, l) => s + toNum(l.unitCost) * Math.floor(l.quantity), 0) * 100) / 100;
  const totalAmount = subTotal;
  const [po] = await db
    .insert(purchaseOrders)
    .values({
      poNumber,
      supplierId: input.supplierId,
      orderDate: input.orderDate,
      expectedDate: input.expectedDate ?? null,
      status: 'ordered',
      subTotal: toMoney(subTotal),
      taxAmount: toMoney(0),
      totalAmount: toMoney(totalAmount),
      notes: input.notes ?? '',
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  const lineRows = input.lines.map((l) => ({
    purchaseOrderId: po.id,
    productId: l.productId,
    quantity: Math.floor(l.quantity),
    unitCost: toMoney(l.unitCost ?? 0),
    lineTotal: toMoney(toNum(l.unitCost) * Math.floor(l.quantity)),
    reorderLevel: l.reorderLevel !== undefined ? Math.max(0, Math.floor(l.reorderLevel)) : null,
    createdAt: now,
  }));
  await db.insert(purchaseOrderLines).values(lineRows);
  await createAuditLog({
    actorId: input.createdBy,
    actorRole: 'admin',
    action: 'purchase_order.created',
    entityType: 'purchase_order',
    entityId: po.id,
    newValue: { poNumber, supplierId: input.supplierId, totalAmount, lines: input.lines.length },
  });
  return getPurchaseOrder(po.id);
};

export const listPurchaseOrders = async (opts: { page?: number; limit?: number; status?: string; supplierId?: number; search?: string } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.status) conditions.push(eq(purchaseOrders.status, opts.status));
  if (opts.supplierId) conditions.push(eq(purchaseOrders.supplierId, opts.supplierId));
  const q = opts.search?.trim();
  if (q) {
    const vendorRows = await db.query.vendors.findMany({ where: ilike(vendors.name, `%${q}%`), columns: { id: true } });
    const searchConditions = [ilike(purchaseOrders.poNumber, `%${q}%`), ilike(purchaseOrders.notes, `%${q}%`)];
    if (vendorRows.length > 0) searchConditions.push(inArray(purchaseOrders.supplierId, vendorRows.map((v) => v.id)));
    conditions.push(or(...searchConditions)!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.query.purchaseOrders.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.orderDate)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(purchaseOrders).where(where ?? sql`1=1`);
  const items = await Promise.all(
    rows.map(async (po) => {
      const supplier = await db.query.vendors.findFirst({ where: eq(vendors.id, po.supplierId) });
      const lines = await db.query.purchaseOrderLines.findMany({ where: eq(purchaseOrderLines.purchaseOrderId, po.id) });
      return {
        ...po,
        _id: String(po.id),
        subTotal: toNum(po.subTotal),
        taxAmount: toNum(po.taxAmount),
        totalAmount: toNum(po.totalAmount),
        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
        lineCount: lines.length,
      };
    })
  );
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getPurchaseOrder = async (id: number) => {
  const po = await db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, id) });
  if (!po) throw new Error('Purchase order not found.');
  const supplier = await db.query.vendors.findFirst({ where: eq(vendors.id, po.supplierId) });
  const lines = await db.query.purchaseOrderLines.findMany({ where: eq(purchaseOrderLines.purchaseOrderId, id) });
  const lineDetails = await Promise.all(
    lines.map(async (l) => {
      const product = await db.query.products.findFirst({ where: eq(products.id, l.productId) });
      return {
        ...l,
        _id: String(l.id),
        unitCost: toNum(l.unitCost),
        lineTotal: toNum(l.lineTotal),
        product: product
          ? { id: product.id, name: product.name, price: toNum(product.price), stock: product.stock ?? 0, reorderLevel: product.reorderLevel ?? 0 }
          : null,
      };
    })
  );
  return {
    ...po,
    _id: String(po.id),
    subTotal: toNum(po.subTotal),
    taxAmount: toNum(po.taxAmount),
    totalAmount: toNum(po.totalAmount),
    supplier: supplier ? { id: supplier.id, name: supplier.name, email: supplier.email, phone: supplier.phone } : null,
    lines: lineDetails,
  };
};

export const receivePurchaseOrder = async (input: { id: number; actorId?: number; ip?: string }) => {
  const po = await getPurchaseOrder(input.id);
  if (po.status !== 'ordered' && po.status !== 'draft') {
    throw new Error(`Purchase order cannot be received (status: ${po.status}).`);
  }
  const now = Date.now();

  await db.transaction(async (tx) => {
    for (const line of po.lines) {
      if (!line.productId) continue;
      await applyStockChange(tx, line.productId, line.quantity, 'purchase_receipt', {
        referenceId: String(po.id),
        note: `PO ${po.poNumber}`,
        createdBy: input.actorId,
      });
      if (line.reorderLevel !== null && line.reorderLevel !== undefined) {
        await tx
          .update(products)
          .set({
            reorderLevel: Math.max(0, line.reorderLevel),
            cost: toMoney(line.unitCost),
          })
          .where(eq(products.id, line.productId));
      } else {
        await tx.update(products).set({ cost: toMoney(line.unitCost) }).where(eq(products.id, line.productId));
      }
    }
    await tx.update(purchaseOrders).set({ status: 'received', receivedDate: now, updatedAt: now }).where(eq(purchaseOrders.id, po.id));

    await tx
      .insert(accountsPayable)
      .values({
        vendorId: po.supplierId,
        billRef: po.poNumber,
        category: 'purchase',
        billDate: now,
        dueDate: now + 30 * 86400000,
        originalAmount: toMoney(po.totalAmount),
        outstandingAmount: toMoney(po.totalAmount),
        status: 'unpaid',
        approvalStatus: 'pending',
        notes: `Purchase order ${po.poNumber}`,
        createdBy: input.actorId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const invAccount = await ensureAccountExists('Inventory / Stock', tx);
    const apAccount = await ensureAccountExists('Accounts Payable', tx);
    await postJournal(
      {
        entryDate: now,
        postingDate: now,
        referenceType: 'purchase_receipt',
        referenceId: po.id,
        description: `Receipt of purchase order ${po.poNumber} from ${po.supplier?.name ?? ''}`,
        lines: [
          { accountId: invAccount.id, debit: po.totalAmount, credit: 0, description: `Inventory received: ${po.poNumber}` },
          { accountId: apAccount.id, debit: 0, credit: po.totalAmount, description: `Accounts payable: ${po.poNumber}` },
        ],
        createdBy: input.actorId,
      },
      tx
    );
  });

  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'purchase_order.received',
    entityType: 'purchase_order',
    entityId: po.id,
    newValue: { poNumber: po.poNumber, totalAmount: po.totalAmount, lines: po.lines.length },
    ip: input.ip,
  });

  return getPurchaseOrder(po.id);
};

export const cancelPurchaseOrder = async (input: { id: number; actorId?: number }) => {
  const po = await db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, input.id) });
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'received') throw new Error('A received purchase order cannot be cancelled.');
  if (po.status === 'cancelled') throw new Error('Purchase order is already cancelled.');
  await db.update(purchaseOrders).set({ status: 'cancelled', updatedAt: Date.now() }).where(eq(purchaseOrders.id, input.id));
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'purchase_order.cancelled',
    entityType: 'purchase_order',
    entityId: input.id,
    newValue: { status: 'cancelled' },
  });
  return getPurchaseOrder(input.id);
};

export const updatePurchaseOrder = async (input: {
  id: number;
  poNumber?: string;
  supplierId?: number;
  orderDate?: number;
  expectedDate?: number | null;
  notes?: string;
  lines?: PurchaseOrderLineInput[];
  actorId?: number;
}) => {
  const po = await db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, input.id) });
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'cancelled') throw new Error('A cancelled purchase order cannot be edited.');
  if (input.supplierId !== undefined) {
    const supplier = await db.query.vendors.findFirst({ where: eq(vendors.id, input.supplierId) });
    if (!supplier) throw new Error('Supplier not found.');
  }
  if (input.lines !== undefined && input.lines.length === 0) throw new Error('At least one purchase line is required.');

  let subTotal = toNum(po.subTotal);
  let totalAmount = toNum(po.totalAmount);

  await db.transaction(async (tx) => {
    if (input.lines !== undefined) {
      await tx.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, input.id));
      const now = Date.now();
      const lineRows = input.lines.map((l) => ({
        purchaseOrderId: input.id,
        productId: l.productId,
        quantity: Math.floor(l.quantity),
        unitCost: toMoney(l.unitCost ?? 0),
        lineTotal: toMoney(toNum(l.unitCost) * Math.floor(l.quantity)),
        reorderLevel: l.reorderLevel !== undefined ? Math.max(0, Math.floor(l.reorderLevel)) : null,
        createdAt: now,
      }));
      await tx.insert(purchaseOrderLines).values(lineRows);
      subTotal = Math.round(input.lines.reduce((s, l) => s + toNum(l.unitCost) * Math.floor(l.quantity), 0) * 100) / 100;
      totalAmount = subTotal;
    }
    const patch: Partial<typeof po> = { updatedAt: Date.now() };
    if (input.poNumber !== undefined && input.poNumber.trim()) patch.poNumber = input.poNumber.trim();
    if (input.supplierId !== undefined) patch.supplierId = input.supplierId;
    if (input.orderDate !== undefined) patch.orderDate = input.orderDate;
    if (input.expectedDate !== undefined) patch.expectedDate = input.expectedDate;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.lines !== undefined) {
      patch.subTotal = toMoney(subTotal);
      patch.totalAmount = toMoney(totalAmount);
    }
    await tx.update(purchaseOrders).set(patch).where(eq(purchaseOrders.id, input.id));
  });

  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'purchase_order.updated',
    entityType: 'purchase_order',
    entityId: input.id,
    previousValue: {
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      orderDate: po.orderDate,
      expectedDate: po.expectedDate,
      notes: po.notes,
      totalAmount: toNum(po.totalAmount),
    },
    newValue: {
      poNumber: input.poNumber?.trim() || po.poNumber,
      supplierId: input.supplierId ?? po.supplierId,
      orderDate: input.orderDate ?? po.orderDate,
      expectedDate: input.expectedDate !== undefined ? input.expectedDate : po.expectedDate,
      notes: input.notes ?? po.notes,
      totalAmount,
      lines: input.lines?.length ?? undefined,
    },
  });
  return getPurchaseOrder(input.id);
};

export const deletePurchaseOrder = async (input: { id: number; actorId?: number }) => {
  const po = await db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, input.id) });
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'cancelled') throw new Error('Purchase order is already cancelled.');
  await db.transaction(async (tx) => {
    await tx.delete(purchaseOrderLines).where(eq(purchaseOrderLines.purchaseOrderId, input.id));
    await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, input.id));
  });
  await createAuditLog({
    actorId: input.actorId,
    actorRole: 'admin',
    action: 'purchase_order.deleted',
    entityType: 'purchase_order',
    entityId: input.id,
    previousValue: { poNumber: po.poNumber, status: po.status },
  });
  return { id: input.id, deleted: true, poNumber: po.poNumber };
};