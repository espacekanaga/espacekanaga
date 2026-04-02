import { api, tokenStorage } from './client';
import type { LoginCredentials, AuthResponse, User } from '../types/auth';

export { tokenStorage };

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignore errors during logout
      }
    }
    tokenStorage.clearTokens();
  },

  refresh: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const { data } = await api.post('/auth/refresh', { refreshToken });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  getCurrentUser: async (): Promise<User> => {
    // In a real app, you might have a /me endpoint
    // For now, we decode from token or store user info
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('No token available');
    }
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      prenom: payload.prenom || '',
      nom: payload.nom || '',
      telephone: payload.telephone || '',
      email: payload.email || '',
      role: payload.role,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
  },
};
