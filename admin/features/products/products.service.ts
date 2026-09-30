import { backendUrl } from '@/config/constants';
import type { Product } from './products.types';

export interface ProductListResult {
  success: boolean;
  products: Product[];
  message?: string;
}

export interface ProductSingleResult {
  success: boolean;
  product?: Product;
  message?: string;
}

export interface ProductResult {
  success: boolean;
  message?: string;
}

export async function fetchProducts(token: string): Promise<ProductListResult> {
  const response = await fetch(backendUrl +'/api/product/list', {
    headers: { token },
  });
  return response.json();
}

export async function apiCreateProduct(token: string, formData: FormData): Promise<ProductResult> {
  const response = await fetch(backendUrl +'/api/product/add', {
    method:'POST',
    body: formData,
    headers: { token },
  });
  return response.json();
}

export async function apiUpdateProduct(token: string, formData: FormData): Promise<ProductResult> {
  const response = await fetch(backendUrl +'/api/product/update', {
    method:'POST',
    body: formData,
    headers: { token },
  });
  return response.json();
}

export async function apiFetchProduct(
  token: string,
  productId: string | number
): Promise<ProductSingleResult> {
  const response = await fetch(backendUrl +'/api/product/single', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify({ productId }),
  });
  return response.json();
}

export async function apiDeleteProduct(
  token: string,
  body: { id: string | number }
): Promise<ProductResult> {
  const response = await fetch(backendUrl +'/api/product/remove', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
