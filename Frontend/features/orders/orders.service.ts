import { api, apiFetch } from '@/services/api';
import type { ApiOrder } from '@/types/common';

export async function fetchUserOrders(
  token: string
): Promise<{ orders: ApiOrder[]; customOrders: ApiOrder[] }> {
  const [ordersRes, customRes] = await Promise.all([
    apiFetch<{ success: boolean; orders?: ApiOrder[] }>(
      api('/api/order/userorders'),
      { method: 'POST', body: {} },
      token
    ),
    apiFetch<{ success: boolean; orders?: ApiOrder[] }>(
      api('/api/custom-order/userorders'),
      { method: 'POST', body: {} },
      token
    ),
  ]);
  return {
    orders: ordersRes.success && ordersRes.data.success ? ordersRes.data.orders || [] : [],
    customOrders: customRes.success && customRes.data.success ? customRes.data.orders || [] : [],
  };
}