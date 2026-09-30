import { backendUrl } from '@/config/constants';
import type { CustomOrder } from './custom-orders.types';

export interface CustomOrderListResult {
  success: boolean;
  orders: CustomOrder[];
  message?: string;
}

export interface CustomOrderStatusResult {
  success: boolean;
  message?: string;
}

export async function fetchCustomOrders(token: string): Promise<CustomOrderListResult> {
  const response = await fetch(backendUrl +'/api/custom-order/list', {
    method:'POST',
    headers: { token },
  });
  return response.json();
}

export async function apiUpdateCustomOrderStatus(
  token: string,
  body: { orderId: string | number; status: string }
): Promise<CustomOrderStatusResult> {
  const response = await fetch(backendUrl +'/api/custom-order/status', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
