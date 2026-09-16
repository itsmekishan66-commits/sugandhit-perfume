import { z } from 'zod';

const anyId = z.union([z.string(), z.number()]).transform(Number);

export const inventoryStockListSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
  search: z.string().trim().optional().default(''),
  lowStock: z.enum(['true', 'false']).optional(),
});

export const inventoryAdjustSchema = z.object({
  productId: anyId,
  change: z.coerce.number().int().refine((v) => v !== 0, 'Change must not be zero.'),
  type: z.enum(['adjustment', 'opening']).optional().default('adjustment'),
  reason: z.string().trim().optional().default(''),
});

export const stockLevelSchema = z.object({
  productId: anyId,
  reorderLevel: z.coerce.number().int().min(0, 'Minimum stock level must be zero or more.'),
});

export const purchaseOrderLineSchema = z.object({
  productId: anyId,
  quantity: z.coerce.number().int().positive('Quantity must be positive.'),
  unitCost: z.coerce.number().min(0).optional().default(0),
  reorderLevel: z.coerce.number().int().min(0).optional(),
});

export const purchaseOrderCreateSchema = z.object({
  supplierId: anyId,
  poNumber: z.string().trim().optional().default(''),
  orderDate: z.coerce.number().min(1),
  expectedDate: z.coerce.number().min(1).optional(),
  notes: z.string().trim().optional().default(''),
  lines: z.array(purchaseOrderLineSchema).min(1, 'At least one line is required.'),
});

export const purchaseOrderIdSchema = z.object({ id: anyId });

export const purchaseOrderUpdateSchema = z.object({
  id: anyId,
  supplierId: anyId.optional(),
  poNumber: z.string().trim().optional(),
  orderDate: z.coerce.number().min(1).optional(),
  expectedDate: z.coerce.number().min(1).nullable().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, 'At least one line is required.').optional(),
});

export const inventoryProductUpdateSchema = z.object({
  productId: anyId,
  name: z.string().trim().min(1, 'Product name is required.').optional(),
  sku: z.string().trim().optional(),
  price: z.coerce.number().min(0, 'Selling price cannot be negative.').optional(),
  cost: z.coerce.number().min(0, 'Cost price cannot be negative.').optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
});

export const inventoryProductRemoveSchema = z.object({
  productId: anyId,
});

export const inventoryMovementListSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
  productId: anyId.optional(),
  type: z.string().optional(),
});
