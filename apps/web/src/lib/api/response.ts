export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  timestamp?: string;
}

export interface PaginatedApiData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    [key: string]: unknown;
  };
}

export function unwrapApiData<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}

export function unwrapPaginatedApiData<T>(
  response: { data: ApiEnvelope<PaginatedApiData<T> | T[]> },
): PaginatedApiData<T> {
  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      meta: {
        total: payload.length,
        page: 1,
        limit: payload.length,
        totalPages: 1,
      },
    };
  }

  return payload;
}
