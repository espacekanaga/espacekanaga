import { api } from './client';
import type { User } from '../types/auth';
import type { ListQueryParams, PaginatedResponse } from '../types/common';

export interface CreateUserRequest {
  prenom: string;
  nom: string;
  telephone: string;
  email?: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  adresse?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  prenom?: string;
  nom?: string;
  telephone?: string;
  email?: string | null;
  adresse?: string;
  theme?: 'dark' | 'light' | 'system';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getAll: async (params?: ListQueryParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  // Get current user profile
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  create: async (user: CreateUserRequest): Promise<User> => {
    const { data } = await api.post<User>('/users', user);
    return data;
  },

  update: async (id: string, user: UpdateUserRequest): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}`, user);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Update current user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.patch<User>('/users/me', data);
    return response.data;
  },

  // Change current user password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.patch('/users/me/password', data);
  },
};
