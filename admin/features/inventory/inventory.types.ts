// Types local to the inventory feature.
// Props interfaces stay inline in their component files.

export interface ProductBrief { id: number; name: string; price: number; stock?: number }

export interface SupplierBrief { id: number; name: string }

export interface POLine { id: number; _id: string; productId: number; quantity: number; unitCost: number; lineTotal: number; reorderLevel: number | null; product: ProductBrief | null }

export interface PurchaseOrder {
  _id: string; id: number; poNumber: string; supplierId: number; supplier: SupplierBrief | null;
  orderDate: number; expectedDate?: number | null; receivedDate?: number | null;
  status: string; subTotal: number; taxAmount: number; totalAmount: number; notes?: string;
  lineCount?: number; lines?: POLine[];
}

export interface LineForm { productId: string; quantity: string; unitCost: string; reorderLevel: string }

export interface StockRoot { _id: string; id: number; name: string; amount: string | number; productCount: number; unitCount: number; lowCount: number }

export interface Summary { items: StockRoot[]; total: number; productCount: number; lowCount: number }

/** Paginated envelope shared by the stock/movement/purchase list endpoints. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Full stock row shown on the Stock tab. */
export interface StockItem {
  _id: string;
  id: number;
  name: string;
  sku?: string | null;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number | null;
}

/** Trimmed stock row used to populate the returns/adjust product picker. */
export interface ReturnStockItem {
  _id: string;
  id: number;
  name: string;
  stock: number;
  price: number;
  reorderLevel: number | null;
}

/** Movement row shown on the Movements tab, with before/after and actor. */
export interface Movement {
  _id: string;
  id: number;
  type: string;
  change: number;
  before: number;
  after: number;
  referenceId?: string | null;
  note?: string;
  createdAt: number;
  product: { id: number; name: string; sku?: string | null } | null;
  actor: { id: number; name: string } | null;
}

/** Trimmed movement row used on the Returns tab. */
export interface ReturnMovement {
  _id: string;
  id: number;
  type: string;
  change: number;
  referenceId?: string | null;
  note?: string;
  createdAt: number;
  product: { id: number; name: string } | null;
}

/**
 * Supplier as the Suppliers tab requires it — every field is filled in by the
 * form before save. Distinct from payments ' PayablesVendor, where the same
 * /api/accounts/vendors endpoint is read permissively.
 */
export interface Vendor {
  _id: string;
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  notes: string;
}

export interface VendorPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  notes: string;
}
