import { TOKEN_STORAGE_KEY } from '@/config/constants';

export function getToken(): string {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (raw === null) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
  } catch {
    return raw;
  }
  return raw;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}