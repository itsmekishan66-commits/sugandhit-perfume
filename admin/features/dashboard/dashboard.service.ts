import { backendUrl } from '@/config/constants';
import type { ApiOrder } from './dashboard.types';
import type { CouponSummary } from '../coupons/coupons.service';

export interface ProductRow {
  name?: string;
  category?: string;
  subCategory?: string;
  price?: string | number;
}

export interface NotificationRow {
  type?: string;
}

export interface DashboardPayload {
  products: ProductRow[];
  orders: ApiOrder[];
  customOrders: ApiOrder[];
  coupons: CouponSummary[];
  notifications: NotificationRow[];
}

export interface ExpenseTotalsPayload {
  success: boolean;
  total: string | number;
}

export async function fetchDashboardData(token: string): Promise<DashboardPayload> {
  const [pRes, oRes, cRes, couponRes, notifRes] = await Promise.all([
    fetch(backendUrl +'/api/product/list'),
    fetch(backendUrl +'/api/order/list', { method:'POST', headers: { token } }),
    fetch(backendUrl +'/api/custom-order/list', { method:'POST', headers: { token } }),
    fetch(backendUrl +'/api/coupon/admin/list', { method:'POST', headers: { token } }),
    fetch(backendUrl +'/api/notification/admin/list', { method:'POST', headers: { token } }),
  ]);

  const [pData, oData, cData, couponData, notifData] = await Promise.all([
    pRes.json(),
    oRes.json(),
    cRes.json(),
    couponRes.json(),
    notifRes.json(),
  ]);

  return {
    products: pData.products || [],
    orders: oData.orders || [],
    customOrders: cData.orders || [],
    coupons: couponData.coupons || [],
    notifications: notifData.notifications || [],
  };
}

export async function fetchExpenseTotals(token: string): Promise<ExpenseTotalsPayload> {
  const response = await fetch(backendUrl +'/api/accounts/expenses/totals', {
    headers: { token },
  });
  return response.json();
}
