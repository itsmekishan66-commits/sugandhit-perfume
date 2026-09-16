import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  products,
  inventoryMovements,
  purchaseOrders,
  purchaseOrderLines,
  accountsPayable,
} from '../../database/schema/index.js';
import { createAuditLog, postJournal, ensureAccountExists } from '../accounting/accounting.service.js';
import { toMoney, toNum } from '../../shared/utils/money.js';
import * as repo from './inventory.repository.js';
import type {
  StockListOpts,
  MovementListOpts,
  InventoryAdjustInput,
  ReorderLevelInput,
  ProductUpdateInput,
  ProductRemoveInput,
  PurchaseOrderInput,
  PurchaseOrderListOpts,
  PurchaseOrderReceiveInput,
  PurchaseOrderCancelInput,
  PurchaseOrderUpdateInput,
  PurchaseOrderDeleteInput,
} from './inventory.types.js';

const applyStockSafe = (before: number, change: number) => Math.max(0, before + Math.floor(change));

const listStockItem = async (productId: number) => {
  const p = await repo.findProductById(productId);
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

export const updateReorderLevel = async (input: ReorderLevelInput) => {
  const product = await repo.findProductById(input.productId);
  if (!product) throw new Error('Product not found.');
  const level = Math.max(0, Math.floor(input.reorderLevel));
  await repo.updateProduct(input.productId, { reorderLevel: level });
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

export const updateProductInfo = async (input: ProductUpdateInput) => {
  const product = await repo.findProductById(input.productId);
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
  await repo.updateProduct(input.productId, patch);
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

export const deleteProduct = async (input: ProductRemoveInput) => {
  const product = await repo.findProductById(input.productId);
  if (!product) throw new Error('Product not found.');
  await repo.deleteProductById(input.productId);
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

export const adjustStock = async (input: InventoryAdjustInput) => {
  const product = await repo.findProductById(input.productId);
  if (!product) throw new Error('Product not found.');
  const type = input.type === 'opening' ? 'opening' : 'adjustment';
  const applied = await repo.applyStockChange(db, input.productId, Math.floor(input.change), type, {
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

export const listStock = async (opts: StockListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.search?.trim()) conditions.push(ilike(products.name, `%${opts.search.trim()}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await repo.findAllProducts(where);
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
  const rows = await repo.findAllProducts();
  let totalUnits = 0;
  let stockValue = 0;
  let lowStockCount = 0;
  for (const p of rows) {
    const stock = p.stock ?? 0;
    totalUnits += stock;
    stockValue += stock * toNum(p.cost);
    if (stock <= (p.reorderLevel ?? 0)) lowStockCount += 1;
  }
  const counts = await repo.countInventoryMovements();
  return {
    totalProducts: rows.length,
    totalUnits,
    stockValue: Math.round(stockValue * 100) / 100,
    lowStockCount,
    movementCount: Number(counts[0]?.count ?? 0),
  };
};

export const listMovements = async (opts: MovementListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.productId) conditions.push(eq(inventoryMovements.productId, opts.productId));
  if (opts.type) conditions.push(eq(inventoryMovements.type, opts.type));
  const q = opts.search?.trim();
  if (q) {
    const productRows = await repo.findProductsBySearch(q);
    const searchConditions = [ilike(inventoryMovements.referenceId, `%${q}%`), ilike(inventoryMovements.note, `%${q}%`)];
    if (productRows.length > 0) searchConditions.push(inArray(inventoryMovements.productId, productRows.map((p) => p.id)));
    conditions.push(or(...searchConditions)!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await repo.findMovementsPaginated(where, limit, (page - 1) * limit);
  const counts = await repo.countMovementsWhere(where);
  const productIds = [...new Set(rows.map((r) => r.productId))];
  const productMap: Record<number, (typeof products.$inferSelect) | null> = {};
  for (const id of productIds) productMap[id] = (await repo.findProductByIdForMovement(id)) ?? null;
  const items = rows.map((r) => ({
    ...r,
    _id: String(r.id),
    product: productMap[r.productId] ? { id: productMap[r.productId]!.id, name: productMap[r.productId]!.name } : null,
  }));
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const createPurchaseOrder = async (input: PurchaseOrderInput) => {
  const supplier = await repo.findVendorById(input.supplierId);
  if (!supplier) throw new Error('Supplier not found.');
  if (input.lines.length === 0) throw new Error('At least one purchase line is required.');
  const now = Date.now();
  const poNumber = input.poNumber?.trim() || `PO-${now}`;
  const subTotal = Math.round(input.lines.reduce((s, l) => s + toNum(l.unitCost) * Math.floor(l.quantity), 0) * 100) / 100;
  const totalAmount = subTotal;
  const [po] = await repo.insertPurchaseOrder({
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
  });
  const lineRows = input.lines.map((l) => ({
    purchaseOrderId: po.id,
    productId: l.productId,
    quantity: Math.floor(l.quantity),
    unitCost: toMoney(l.unitCost ?? 0),
    lineTotal: toMoney(toNum(l.unitCost) * Math.floor(l.quantity)),
    reorderLevel: l.reorderLevel !== undefined ? Math.max(0, Math.floor(l.reorderLevel)) : null,
    createdAt: now,
  }));
  await repo.insertPurchaseOrderLines(lineRows);
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

export const listPurchaseOrders = async (opts: PurchaseOrderListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.status) conditions.push(eq(purchaseOrders.status, opts.status));
  if (opts.supplierId) conditions.push(eq(purchaseOrders.supplierId, opts.supplierId));
  const q = opts.search?.trim();
  if (q) {
    const vendorRows = await repo.findVendorsBySearch(q);
    const searchConditions = [ilike(purchaseOrders.poNumber, `%${q}%`), ilike(purchaseOrders.notes, `%${q}%`)];
    if (vendorRows.length > 0) searchConditions.push(inArray(purchaseOrders.supplierId, vendorRows.map((v) => v.id)));
    conditions.push(or(...searchConditions)!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await repo.findPurchaseOrdersPaginated(where, limit, (page - 1) * limit);
  const counts = await repo.countPurchaseOrdersWhere(where);
  const items = await Promise.all(
    rows.map(async (po) => {
      const supplier = await repo.findVendorById(po.supplierId);
      const lines = await repo.findPurchaseOrderLinesByPOId(po.id);
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
  const po = await repo.findPurchaseOrderById(id);
  if (!po) throw new Error('Purchase order not found.');
  const supplier = await repo.findVendorById(po.supplierId);
  const lines = await repo.findPurchaseOrderLinesByPOId(id);
  const lineDetails = await Promise.all(
    lines.map(async (l) => {
      const product = await repo.findProductById(l.productId);
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

export const receivePurchaseOrder = async (input: PurchaseOrderReceiveInput) => {
  const po = await getPurchaseOrder(input.id);
  if (po.status !== 'ordered' && po.status !== 'draft') {
    throw new Error(`Purchase order cannot be received (status: ${po.status}).`);
  }
  const now = Date.now();

  await repo.transaction(async (tx) => {
    for (const line of po.lines) {
      if (!line.productId) continue;
      await repo.applyStockChange(tx, line.productId, line.quantity, 'purchase_receipt', {
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

export const cancelPurchaseOrder = async (input: PurchaseOrderCancelInput) => {
  const po = await repo.findPurchaseOrderById(input.id);
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'received') throw new Error('A received purchase order cannot be cancelled.');
  if (po.status === 'cancelled') throw new Error('Purchase order is already cancelled.');
  await repo.updatePurchaseOrderById(input.id, { status: 'cancelled', updatedAt: Date.now() });
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

export const updatePurchaseOrder = async (input: PurchaseOrderUpdateInput) => {
  const po = await repo.findPurchaseOrderById(input.id);
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'cancelled') throw new Error('A cancelled purchase order cannot be edited.');
  if (input.supplierId !== undefined) {
    const supplier = await repo.findVendorById(input.supplierId);
    if (!supplier) throw new Error('Supplier not found.');
  }
  if (input.lines !== undefined && input.lines.length === 0) throw new Error('At least one purchase line is required.');

  let subTotal = toNum(po.subTotal);
  let totalAmount = toNum(po.totalAmount);

  await repo.transaction(async (tx) => {
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

export const deletePurchaseOrder = async (input: PurchaseOrderDeleteInput) => {
  const po = await repo.findPurchaseOrderById(input.id);
  if (!po) throw new Error('Purchase order not found.');
  if (po.status === 'cancelled') throw new Error('Purchase order is already cancelled.');
  await repo.transaction(async (tx) => {
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
