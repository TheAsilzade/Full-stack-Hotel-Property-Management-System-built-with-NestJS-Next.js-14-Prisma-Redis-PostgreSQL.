import { apiClient } from './client';

export const roomsApi = {
  getAll: (propertyId: string, params?: {
    status?: string;
    roomTypeId?: string;
    floor?: number;
  }) => apiClient.get(`/v1/properties/${propertyId}/rooms`, { params }),

  getOne: (id: string) => apiClient.get(`/v1/rooms/${id}`),

  create: (data: unknown) => apiClient.post('/v1/rooms', data),

  update: (id: string, data: unknown) => apiClient.patch(`/v1/rooms/${id}`, data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/v1/rooms/${id}/status`, { status }),

  remove: (id: string) => apiClient.delete(`/v1/rooms/${id}`),

  getRoomTypes: (propertyId: string) =>
    apiClient.get(`/v1/properties/${propertyId}/room-types`),

  createRoomType: (propertyId: string, data: unknown) =>
    apiClient.post(`/v1/properties/${propertyId}/room-types`, data),

  getAvailability: (propertyId: string, params: {
    checkIn: string;
    checkOut: string;
  }) => apiClient.get(`/v1/properties/${propertyId}/rooms/availability`, { params }),
};