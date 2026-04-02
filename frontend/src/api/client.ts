import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshRequest, RefreshResponse } from '../types/auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'kanaga_access_token';
const REFRESH_TOKEN_KEY = 'kanaga_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  setAccessToken: (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
};

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function isAuthEndpoint(url: string | undefined) {
  const u = url ?? '';
  return u.includes('/auth/login') || u.includes('/auth/refresh') || u.includes('/auth/logout');
}

// Request interceptor - add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && !isAuthEndpoint(config.url)) {
      if (!config.headers) config.headers = new AxiosHeaders();
      const headersAny = config.headers as any;
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (typeof headersAny.set === 'function') {
        headersAny.set('Authorization', `Bearer ${token}`);
      } else {
        headersAny.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          const response = await axios.post<RefreshResponse>(`${API_URL}/auth/refresh`, {
            refreshToken,
          } as RefreshRequest);

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          tokenStorage.setTokens(accessToken, newRefreshToken);

          isRefreshing = false;
          onTokenRefreshed(accessToken);

          if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
          const headersAny = originalRequest.headers as any;
          if (originalRequest.headers instanceof AxiosHeaders) {
            originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
          } else if (typeof headersAny.set === 'function') {
            headersAny.set('Authorization', `Bearer ${accessToken}`);
          } else {
            headersAny.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          tokenStorage.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject(refreshError);
        }
      }

      // If already refreshing, queue the request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          if (!originalRequest.headers) originalRequest.headers = new AxiosHeaders();
          const headersAny = originalRequest.headers as any;
          if (originalRequest.headers instanceof AxiosHeaders) {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          } else if (typeof headersAny.set === 'function') {
            headersAny.set('Authorization', `Bearer ${newToken}`);
          } else {
            headersAny.Authorization = `Bearer ${newToken}`;
          }
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);
