import { apiClient } from './client';

export const reservationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    propertyId?: string;
    guestId?: string;
    checkInFrom?: string;
    checkInTo?: string;
    overlapStart?: string;
    overlapEnd?: string;
    search?: string;
  }) => apiClient.get('/v1/reservations', { params }),

  getOne: (id: string) => apiClient.get(`/v1/reservations/${id}`),

  getByConfirmation: (confirmationNumber: string) =>
    apiClient.get(`/v1/reservations/confirmation/${confirmationNumber}`),

  getAvailability: (params: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
  }) => apiClient.get('/v1/reservations/availability', { params }),

  create: (data: unknown) => apiClient.post('/v1/reservations', data),

  update: (id: string, data: unknown) => apiClient.patch(`/v1/reservations/${id}`, data),

  checkIn: (id: string) => apiClient.post(`/v1/reservations/${id}/check-in`),

  checkOut: (id: string) => apiClient.post(`/v1/reservations/${id}/check-out`),

  cancel: (id: string, data: { reason?: string }) =>
    apiClient.post(`/v1/reservations/${id}/cancel`, data),
};
