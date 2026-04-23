import { apiClient } from './client';

export const usersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    propertyId?: string;
    isActive?: boolean;
  }) => apiClient.get('/v1/users', { params }),

  getOne: (id: string) => apiClient.get(`/v1/users/${id}`),

  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    roleIds: string[];
    propertyIds?: string[];
    phone?: string;
  }) => apiClient.post('/v1/users', data),

  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleIds?: string[];
    propertyIds?: string[];
    isActive?: boolean;
  }) => apiClient.patch(`/v1/users/${id}`, data),

  getRoles: () => apiClient.get('/v1/users/roles'),

  remove: (id: string) => apiClient.delete(`/v1/users/${id}`),

  changePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch(`/v1/users/${id}/change-password`, data),
};

export const propertiesApi = {
  getAll: () => apiClient.get('/v1/properties'),

  getOne: (id: string) => apiClient.get(`/v1/properties/${id}`),

  update: (id: string, data: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    timezone?: string;
    currencyCode?: string;
  }) => apiClient.patch(`/v1/properties/${id}`, data),
};
