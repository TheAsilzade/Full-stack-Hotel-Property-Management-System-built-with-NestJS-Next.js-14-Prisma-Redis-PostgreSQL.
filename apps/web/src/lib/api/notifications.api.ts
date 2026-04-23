import { apiClient } from './client';

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get('/v1/notifications', {
      params: {
        page: params?.page,
        limit: params?.limit,
        isRead: params?.unreadOnly ? false : undefined,
      },
    }),

  getUnreadCount: () => apiClient.get('/v1/notifications/unread-count'),

  markAsRead: (id: string) => apiClient.post(`/v1/notifications/${id}/read`),

  markAllAsRead: () => apiClient.post('/v1/notifications/read-all'),

  delete: (id: string) => apiClient.delete(`/v1/notifications/${id}`),
};
