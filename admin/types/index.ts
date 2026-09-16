export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  message?: string;
}

export interface User {
  _id: string;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: number;
  creditBalance?: number;
}

export interface ProductVariant {
  _id?: string;
  name?: string;
  price?: string | number;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  id: number;
  name: string;
  description: string;
  price: string | number;
  image?: string;
  category?: string;
  subCategory?: string;
  bestseller?: boolean;
  color?: string;
  size?: string;
  stock: number;
  reorderLevel?: number | null;
  variants?: ProductVariant[];
  createdAt: number;
}

export interface ProductOption {
  id: number;
  name: string;
  sku?: string | null;
  price?: number | string;
}

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

export interface OrderItem {
  productId?: number;
  name?: string;
  price?: string | number;
  quantity?: string | number;
  image?: string;
  notes?: string;
}

export interface CustomerRef {
  id: number;
  name: string;
  phone?: string;
}

export interface Order {
  _id: string;
  id: number;
  items: OrderItem[];
  customer?: CustomerRef | null;
  status: string;
  payment?: string;
  amounts?: Record<string, number>;
  amount?: number;
  address?: Record<string, unknown>;
  date: number;
  createdAt: number;
}

export interface Coupon {
  _id: string;
  id?: number;
  code: string;
  description?: string;
  discountType?: string;
  discountValue?: string | number;
  minOrder?: string | number;
  maxDiscount?: string | number;
  active?: boolean;
  expiresAt?: number;
}

export interface AppNotification {
  _id: string;
  id?: number;
  title?: string;
  body?: string;
  type?: string;
  active?: boolean;
  segment?: string;
  createdAt: number;
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

export interface PaymentAccount {
  _id: string;
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface PaymentTransaction {
  _id: string;
  id: number;
  type: string;
  status: string;
  channel?: string;
  amount: number;
  reference?: string;
  account?: { id: number; name: string } | null;
  order?: { id: number } | null;
  customer?: CustomerRef | null;
  note?: string;
  createdAt: number;
}

export interface DebtEntry {
  _id: string;
  id: number;
  type: string;
  status: string;
  amount: number;
  paid?: number;
  customer?: CustomerRef | null;
  account?: { id: number; name: string } | null;
  dueDate?: number;
  createdAt: number;
}

export interface Refund {
  _id: string;
  id: number;
  status: string;
  type: string;
  amount: number;
  account?: { id: number; name: string } | null;
  order?: { id: number } | null;
  customer?: CustomerRef | null;
  note?: string;
  createdAt: number;
}

export interface ReconItem {
  _id: string;
  id: number;
  status: string;
  amount: number;
  reference?: string;
  internal?: { id: number; name?: string } | null;
  external?: { id: number; name?: string } | null;
  createdAt: number;
}

export interface Account {
  _id: string;
  id: number;
  name: string;
  type: string;
  code?: string;
  description?: string;
  balance?: number;
  createdAt: number;
}

export interface Journal {
  _id: string;
  id: number;
  date: number;
  reference?: string;
  description?: string;
  status?: string;
  entries?: { accountId?: number; accountName?: string; debit?: number; credit?: number }[];
  createdAt: number;
}

export interface AccountingPeriod {
  _id: string;
  id: number;
  name?: string;
  start?: number;
  end?: number;
  status?: string;
  createdAt: number;
}