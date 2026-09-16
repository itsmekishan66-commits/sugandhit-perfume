import { BACKEND_URL } from '@/config/constants';
import type { ApiResult } from '@/types/api';

export const api = (path: string) => `${BACKEND_URL}${path}`;

export async function apiFetch<TData = unknown>(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
  token?: string
): Promise<ApiResult<TData>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (token) {
    headers.token = token;
  }
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json()) as TData;
  return { response, data, success: response.ok };
}