import { api } from './client';
import type { Client, CreateClientRequest, UpdateClientRequest } from '../types/client';
import type { ListQueryParams, PaginatedResponse } from '../types/common';

export const clientsApi = {
  getAll: async (params?: ListQueryParams): Promise<PaginatedResponse<Client>> => {
    const { data } = await api.get<PaginatedResponse<Client>>('/clients', { params });
    return data;
  },

  getById: async (id: string): Promise<Client> => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  create: async (client: CreateClientRequest): Promise<Client> => {
    const { data } = await api.post<Client>('/clients', client);
    return data;
  },

  update: async (id: string, client: UpdateClientRequest): Promise<Client> => {
    const { data } = await api.patch<Client>(`/clients/${id}`, client);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  searchByPhone: async (telephone: string): Promise<Client | null> => {
    const { data } = await api.get<Client[]>('/clients', { params: { search: telephone, limit: 1 } });
    return data[0] || null;
  },
};
