import { apiClient } from './client';

export const guestsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    nationality?: string;
  }) => apiClient.get('/v1/guests', { params }),

  getOne: (id: string) => apiClient.get(`/v1/guests/${id}`),

  getStayHistory: (id: string) => apiClient.get(`/v1/guests/${id}/stay-history`),

  create: (data: unknown) => apiClient.post('/v1/guests', data),

  update: (id: string, data: unknown) => apiClient.patch(`/v1/guests/${id}`, data),

  remove: (id: string) => apiClient.delete(`/v1/guests/${id}`),
};
