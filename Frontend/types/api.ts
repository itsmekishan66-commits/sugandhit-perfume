export interface ApiResult<TData = unknown> {
  response: Response;
  data: TData;
  success: boolean;
}

export interface ApiEnvelope {
  success: boolean;
  message?: string;
}