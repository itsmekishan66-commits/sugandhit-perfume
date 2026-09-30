import { backendUrl } from '@/config/constants';
import type { Order } from './orders.types';

export interface OrderListResult {
  success: boolean;
  orders: Order[];
  message?: string;
}

export interface OrderStatusResult {
  success: boolean;
  message?: string;
}

export async function fetchOrders(token: string): Promise<OrderListResult> {
  const response = await fetch(backendUrl +'/api/order/list', {
    method:'POST',
    headers: { token },
  });
  return response.json();
}

export async function apiUpdateOrderStatus(
  token: string,
  body: { orderId: string | number; status: string }
): Promise<OrderStatusResult> {
  const response = await fetch(backendUrl +'/api/order/status', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
