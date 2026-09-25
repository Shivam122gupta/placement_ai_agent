export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: any;
  };
}
