import { api, apiFetch } from '@/services/api';
import type { Product } from '@/types/product';

export async function fetchProducts(): Promise<{ products: Product[]; message?: string }> {
  const { data, success } = await apiFetch<{ success: boolean; products?: Product[]; message?: string }>(
    api('/api/product/list')
  );
  if (!success || !data.success) {
    return { products: [], message: data.message };
  }
  return { products: data.products || [] };
}