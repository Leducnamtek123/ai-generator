import axios from 'axios';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (page = 1, limit = 10) => {
    const response = await axios.get<Notification[]>('/api/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get<{ count: number }>('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await axios.patch<Notification>(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.patch<{ success: boolean }>('/api/notifications/mark-all-read');
    return response.data;
  },
};
