import { api } from './client';
import type { ListQueryParams, PaginatedResponse } from '../types/common';
import type { InvoiceDetail, InvoiceSummary } from '../types/invoice';

export const invoicesApi = {
  getAll: async (params?: ListQueryParams & { search?: string }): Promise<PaginatedResponse<InvoiceSummary>> => {
    const { data } = await api.get<PaginatedResponse<InvoiceSummary>>('/invoices', { params });
    return data;
  },

  getById: async (id: string): Promise<InvoiceDetail> => {
    const { data } = await api.get<InvoiceDetail>(`/invoices/${id}`);
    return data;
  },
};

