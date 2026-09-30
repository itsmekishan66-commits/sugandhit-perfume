export interface StockItem {
  _id: string;
  id: number;
  name: string;
  stock: number;
  price: number;
  reorderLevel: number | null;
}

export interface StockMovement {
  _id: string;
  id: number;
  type: string;
  change: number;
  before?: number;
  after?: number;
  referenceId?: string | null;
  note?: string | null;
  createdAt: number;
  product?: { id: number; name: string; sku?: string | null } | null;
  actor?: { id: number; name: string } | null;
}

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

export interface VendorOption {
  id: number;
  name: string;
}

export interface PurchaseOrderLine {
  productId: number;
  name?: string;
  quantity: number;
  unitPrice?: number;
}

export interface PurchaseOrder {
  _id: string;
  id: number;
  vendor: VendorOption | null;
  lines: PurchaseOrderLine[];
  status: string;
  total?: number;
  note?: string;
  createdAt: number;
}
