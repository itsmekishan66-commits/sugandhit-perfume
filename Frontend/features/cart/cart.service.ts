import { api, apiFetch } from '@/services/api';
import type { CartItems } from '@/types/common';

export async function apiCartAdd(
  token: string,
  itemId: string,
  colors: string,
  quantity: number
): Promise<boolean> {
  const { success } = await apiFetch(
    api('/api/cart/add'),
    { method: 'POST', body: { itemId, colors, quantity } },
    token
  );
  return success;
}

export async function apiCartUpdate(
  token: string,
  itemId: string,
  colors: string,
  quantity: number
): Promise<boolean> {
  const { success } = await apiFetch(
    api('/api/cart/update'),
    { method: 'POST', body: { itemId, colors, quantity } },
    token
  );
  return success;
}

export async function apiCartGet(token: string): Promise<CartItems> {
  const { data, success } = await apiFetch<{ success: boolean; cartData?: CartItems }>(
    api('/api/cart/get'),
    { method: 'POST', body: {} },
    token
  );
  return success && data.success ? (data.cartData || {}) : {};
}