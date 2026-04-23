import { apiClient } from './client';
import type { LoginResponse, AuthTokens } from '@Noblesse/shared';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<{ data: LoginResponse }>('/v1/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: AuthTokens }>('/v1/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/v1/auth/logout'),

  getMe: () => apiClient.get('/v1/auth/me'),
};