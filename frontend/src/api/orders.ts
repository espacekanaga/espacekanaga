import { api } from './client';
import type {
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from '../types/order';
import type { ListQueryParams, PaginatedResponse } from '../types/common';

export interface GenerateInvoiceRequest {
  tauxTVA?: number;
  notes?: string;
}

export const ordersApi = {
  getAll: async (params?: ListQueryParams): Promise<PaginatedResponse<Order>> => {
    const { data } = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return data;
  },

  getById: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  create: async (order: CreateOrderRequest): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', order);
    return data;
  },

  updateStatus: async (id: string, status: UpdateOrderStatusRequest): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, status);
    return data;
  },

  getByClient: async (clientId: string): Promise<Order[]> => {
    const { data } = await api.get<Order[]>(`/orders/client/${clientId}`);
    return data;
  },

  generateInvoice: async (
    orderId: string,
    payload?: GenerateInvoiceRequest
  ): Promise<{ filePath: string; downloadUrl: string }> => {
    const { data } = await api.post(`/orders/${orderId}/invoice`, payload ?? {});
    return data;
  },
};
