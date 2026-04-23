import { apiClient } from './client';

export const reportsApi = {
  getDashboardStats: (propertyId?: string) =>
    apiClient.get('/v1/reports/dashboard', { params: { propertyId } }),

  getOccupancy: (params: {
    propertyId: string;
    startDate: string;
    endDate: string;
  }) => apiClient.get('/v1/reports/occupancy', { params }),

  getRevenue: (params: {
    propertyId: string;
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }) =>
    apiClient.get('/v1/reports/revenue', {
      params: {
        propertyId: params.propertyId,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    }),

  getReservationStats: (params: {
    propertyId: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get('/v1/reports/reservations/stats', { params }),
};
