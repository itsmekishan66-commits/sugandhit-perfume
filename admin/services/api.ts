import { backendUrl } from '../config';

export const api = async <T = Record<string, unknown>>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> => {
  const headers: Record<string, string> = { token };
  const init: RequestInit = { method: options.method ?? 'GET', headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(backendUrl + path, init);
  const data = (await res.json().catch(() => ({ success: false, message: 'Invalid server response' }))) as T & {
    success?: boolean;
    message?: string;
    code?: string;
  };
  if (!res.ok || data.code === 'AUTH' || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
};