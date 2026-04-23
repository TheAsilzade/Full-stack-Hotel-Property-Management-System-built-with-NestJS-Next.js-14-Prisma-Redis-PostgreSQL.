import { apiClient } from './client';

export const housekeepingApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    propertyId?: string;
    status?: string;
    assignedToId?: string;
    scheduledDate?: string;
    roomId?: string;
  }) => apiClient.get('/v1/housekeeping', { params }),

  getToday: (propertyId?: string) =>
    apiClient.get('/v1/housekeeping/today', { params: { propertyId } }),

  getOne: (id: string) => apiClient.get(`/v1/housekeeping/${id}`),

  create: (data: unknown) => apiClient.post('/v1/housekeeping', data),

  update: (id: string, data: unknown) => apiClient.patch(`/v1/housekeeping/${id}`, data),

  start: (id: string) => apiClient.post(`/v1/housekeeping/${id}/start`),

  complete: (id: string, data?: { notes?: string }) =>
    apiClient.post(`/v1/housekeeping/${id}/complete`, data),

  verify: (id: string) => apiClient.post(`/v1/housekeeping/${id}/verify`),

  skip: (id: string, data?: { reason?: string }) =>
    apiClient.post(`/v1/housekeeping/${id}/skip`, data),
};
