import { api } from '@/services/api';
import type {
  Movement,
  Paged,
  ProductBrief,
  PurchaseOrder,
  ReturnMovement,
  ReturnStockItem,
  StockItem,
  Summary,
  SupplierBrief,
  Vendor,
  VendorPayload,
} from './inventory.types';

export interface ApiResult {
  success: boolean;
  message?: string;
}

export interface DataResult<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ItemsResult<T> {
  success: boolean;
  items: T[];
  total: number;
  message?: string;
}

/* ---- Movements ---- */

export async function fetchMovements(
  token: string,
  page: number,
  limit: number,
  filters: { type?: string; search?: string } = {}
): Promise<DataResult<Paged<Movement>>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.type) q.set('type', filters.type);
  if (filters.search) q.set('search', filters.search);
  return api<DataResult<Paged<Movement>>>(`/api/inventory/movements?${q}`, token);
}

export async function fetchReturnMovements(
  token: string,
  limit: number,
  search?: string
): Promise<DataResult<{ items: ReturnMovement[]; total: number }>> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (search) q.set('search', search);
  return api<DataResult<{ items: ReturnMovement[]; total: number }>>(
    `/api/inventory/movements?${q}`,
    token
  );
}

/* ---- Stock ---- */

export async function fetchStock(
  token: string,
  page: number,
  limit: number,
  filters: { search?: string; lowStock?: boolean } = {}
): Promise<DataResult<Paged<StockItem>>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.search) q.set('search', filters.search);
  if (filters.lowStock) q.set('lowStock','true');
  return api<DataResult<Paged<StockItem>>>(`/api/inventory/stock?${q}`, token);
}

export async function fetchStockSummary(token: string): Promise<DataResult<Summary>> {
  return api<DataResult<Summary>>('/api/inventory/summary', token);
}

/** Flat stock list used to populate the returns/adjust product picker. */
export async function fetchReturnStockPicker(
  token: string,
  limit: number
): Promise<DataResult<{ items: ReturnStockItem[] }>> {
  return api<DataResult<{ items: ReturnStockItem[] }>>(`/api/inventory/stock?limit=${limit}`, token);
}

export interface StockProductPayload {
  productId: number;
  name: string;
  sku: string;
  price: number;
  cost: number;
  reorderLevel: number;
}

export async function apiUpdateStockProduct(
  token: string,
  body: StockProductPayload
): Promise<ApiResult> {
  return api('/api/inventory/stock/product', token, { method:'POST', body });
}

export async function apiRemoveStockProduct(
  token: string,
  body: { productId: number }
): Promise<ApiResult> {
  return api('/api/inventory/stock/product/remove', token, { method:'POST', body });
}

export async function apiAdjustStock(
  token: string,
  body: { productId: number; change: number; reason: string }
): Promise<ApiResult> {
  return api('/api/inventory/stock/adjust', token, { method:'POST', body });
}

/* ---- Purchase orders ---- */

export async function fetchPurchaseOrders(
  token: string,
  page: number,
  limit: number,
  filters: { status?: string; search?: string } = {}
): Promise<DataResult<Paged<PurchaseOrder>>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.status) q.set('status', filters.status);
  if (filters.search) q.set('search', filters.search);
  return api<DataResult<Paged<PurchaseOrder>>>(`/api/inventory/purchases?${q}`, token);
}

export async function fetchPurchaseOrder(
  token: string,
  id: number
): Promise<DataResult<PurchaseOrder>> {
  return api<DataResult<PurchaseOrder>>(`/api/inventory/purchases/${id}`, token);
}

export async function fetchSuppliersPicker(
  token: string
): Promise<ItemsResult<SupplierBrief>> {
  return api<ItemsResult<SupplierBrief>>('/api/accounts/vendors?limit=500', token);
}

export async function fetchProductsPicker(
  token: string,
  limit: number
): Promise<DataResult<{ items: ProductBrief[] }>> {
  return api<DataResult<{ items: ProductBrief[] }>>(`/api/inventory/stock?limit=${limit}`, token);
}

export interface POLinePayload {
  productId: number;
  quantity: number;
  unitCost: number;
  reorderLevel?: number;
}

export interface PurchaseOrderPayload {
  supplierId: number;
  poNumber: string;
  orderDate: number;
  expectedDate?: number | null;
  notes: string;
  lines: POLinePayload[];
}

export interface PurchaseOrderUpdatePayload extends PurchaseOrderPayload {
  id: number;
}

export async function apiCreatePurchaseOrder(
  token: string,
  body: PurchaseOrderPayload
): Promise<ApiResult> {
  return api('/api/inventory/purchases', token, { method:'POST', body });
}

export async function apiUpdatePurchaseOrder(
  token: string,
  body: PurchaseOrderUpdatePayload
): Promise<ApiResult> {
  return api('/api/inventory/purchases/update', token, { method:'POST', body });
}

export async function apiReceivePurchaseOrder(
  token: string,
  body: { id: number }
): Promise<ApiResult> {
  return api('/api/inventory/purchases/receive', token, { method:'POST', body });
}

export async function apiCancelPurchaseOrder(
  token: string,
  body: { id: number }
): Promise<ApiResult> {
  return api('/api/inventory/purchases/cancel', token, { method:'POST', body });
}

export async function apiDeletePurchaseOrder(
  token: string,
  body: { id: number }
): Promise<ApiResult> {
  return api('/api/inventory/purchases/delete', token, { method:'POST', body });
}

/* ---- Suppliers (vendors) ---- */

export async function fetchVendors(
  token: string,
  limit: number,
  search?: string
): Promise<ItemsResult<Vendor>> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (search) q.set('search', search);
  return api<ItemsResult<Vendor>>(`/api/accounts/vendors?${q}`, token);
}

export async function apiCreateVendor(
  token: string,
  body: VendorPayload
): Promise<ApiResult> {
  return api('/api/accounts/vendors', token, { method:'POST', body });
}

export async function apiUpdateVendor(
  token: string,
  id: number,
  body: VendorPayload
): Promise<ApiResult> {
  return api(`/api/accounts/vendors/${id}`, token, { method:'PUT', body });
}

export async function apiDeleteVendor(token: string, id: number): Promise<ApiResult> {
  return api(`/api/accounts/vendors/${id}`, token, { method:'DELETE' });
}
