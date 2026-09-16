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

export interface InventoryAdjustInput {
  productId: number;
  change: number;
  type?: string;
  reason?: string;
  actorId?: number;
  ip?: string;
}

export interface ReorderLevelInput {
  productId: number;
  reorderLevel: number;
  actorId?: number;
}

export interface ProductUpdateInput {
  productId: number;
  name?: string;
  sku?: string;
  price?: number;
  cost?: number;
  reorderLevel?: number;
  actorId?: number;
}

export interface ProductRemoveInput {
  productId: number;
  actorId?: number;
}

export interface StockListOpts {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: string;
}

export interface MovementListOpts {
  page?: number;
  limit?: number;
  productId?: number;
  type?: string;
  search?: string;
}

export interface PurchaseOrderListOpts {
  page?: number;
  limit?: number;
  status?: string;
  supplierId?: number;
  search?: string;
}

export interface PurchaseOrderReceiveInput {
  id: number;
  actorId?: number;
  ip?: string;
}

export interface PurchaseOrderCancelInput {
  id: number;
  actorId?: number;
}

export interface PurchaseOrderUpdateInput {
  id: number;
  poNumber?: string;
  supplierId?: number;
  orderDate?: number;
  expectedDate?: number | null;
  notes?: string;
  lines?: PurchaseOrderLineInput[];
  actorId?: number;
}

export interface PurchaseOrderDeleteInput {
  id: number;
  actorId?: number;
}

export interface ApplyStockChangeOpts {
  referenceId?: string;
  note?: string;
  createdBy?: number;
}

export interface StockAdjustAudit {
  change: number;
  type: string;
  reason: string;
  previousStock: number;
  newStock: number;
}

export interface StockSummary {
  totalProducts: number;
  totalUnits: number;
  stockValue: number;
  lowStockCount: number;
  movementCount: number;
}

export interface StockItem {
  id: number;
  _id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  lowStock: boolean;
}
