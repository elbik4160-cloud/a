export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  error: string;
  code: string;
  success: false;
  details?: Record<string, string[]>;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
