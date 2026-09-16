import { api, apiFetch } from '@/services/api';

export async function apiWishlistAdd(token: string, productId: string): Promise<boolean> {
  const { success } = await apiFetch(
    api('/api/wishlist/add'),
    { method: 'POST', body: { productId } },
    token
  );
  return success;
}

export async function apiWishlistRemove(token: string, productId: string): Promise<boolean> {
  const { success } = await apiFetch(
    api('/api/wishlist/remove'),
    { method: 'POST', body: { productId } },
    token
  );
  return success;
}

export async function apiWishlistGet(token: string): Promise<string[]> {
  const { data, success } = await apiFetch<{ success: boolean; wishlist?: string[] }>(
    api('/api/wishlist/get'),
    { method: 'POST', body: {} },
    token
  );
  return success && data.success ? (data.wishlist || []) : [];
}