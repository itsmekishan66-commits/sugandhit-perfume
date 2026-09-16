export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ApiErrorResponse extends ApiResponse<never> {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface Actor {
  actorId?: number | null;
  ip?: string;
}