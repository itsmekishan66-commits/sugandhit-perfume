export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  message?: string;
}
