import { api } from './client';

export interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  type: 'order_created' | 'order_updated' | 'order_status_changed' | 'order_completed' | 'invoice_created' | 'invoice_paid' | 'message' | 'alert';
  title: string;
  message: string;
  orderId?: string;
  invoiceId?: string;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
  };
  order?: {
    id: string;
    status: string;
    type: string;
    client: {
      prenom: string;
      nom: string;
    };
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationsApi = {
  getAll: async (unreadOnly = false, limit = 50): Promise<NotificationsResponse> => {
    const { data } = await api.get('/notifications', {
      params: { unreadOnly, limit }
    });
    return data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
