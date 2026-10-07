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

export interface ProductsPageParams {
  page: number;
  limit: number;
  search?: string;
  categories?: string[];
  subCategories?: string[];
  sort?: string;
}

export async function fetchProductsPage({
  page,
  limit,
  search,
  categories,
  subCategories,
  sort,
}: ProductsPageParams): Promise<{ items: Product[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) params.set('search', search.trim());
  if (categories?.length) params.set('category', categories.join(','));
  if (subCategories?.length) params.set('subCategory', subCategories.join(','));
  if (sort) params.set('sort', sort);
  const { data, success } = await apiFetch<{
    success: boolean;
    products?: Product[];
    total?: number;
    message?: string;
  }>(api('/api/product/list?' + params.toString()));
  if (!success || !data.success) {
    throw new Error(data.message || 'Failed to load products');
  }
  return { items: data.products || [], total: data.total || 0 };
}