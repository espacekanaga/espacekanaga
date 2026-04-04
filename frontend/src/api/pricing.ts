import { api } from './client';

export interface PricingItem {
  serviceName: string;
  price: number;
  category: 'pressing' | 'atelier';
}

export interface PricingResponse {
  pressing: [string, string][];
  atelier: [string, string][];
}

export const pricingApi = {
  // Get all pricing (authenticated)
  get: async (): Promise<PricingResponse> => {
    const { data } = await api.get<PricingResponse>('/settings/pricing');
    return data;
  },

  // Get public pricing (no auth required)
  getPublic: async (): Promise<PricingResponse> => {
    const { data } = await api.get<PricingResponse>('/public/pricing');
    return data;
  },

  // Update all pricing (super admin only)
  update: async (pricing: PricingItem[]): Promise<PricingResponse> => {
    const { data } = await api.put<PricingResponse>('/settings/pricing', pricing);
    return data;
  },

  // Add or update single pricing item
  updateItem: async (item: PricingItem): Promise<PricingResponse> => {
    const { data } = await api.post<PricingResponse>('/settings/pricing/item', item);
    return data;
  },

  // Delete a pricing item
  deleteItem: async (serviceName: string, category: 'pressing' | 'atelier'): Promise<PricingResponse> => {
    const { data } = await api.delete<PricingResponse>('/settings/pricing/item', {
      data: { serviceName, category }
    });
    return data;
  },
};
