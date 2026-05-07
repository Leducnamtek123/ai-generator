import { api } from '@/lib/api';

export type NotificationCategory =
  | 'payment'
  | 'workflow'
  | 'social'
  | 'moderation'
  | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  category: NotificationCategory;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  category: NotificationCategory;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  adminAlertsEnabled: boolean;
}

export const notificationApi = {
  getNotifications: async (page = 1, limit = 10) => {
    const response = await api.get<Notification[]>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get<NotificationPreference[]>('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: NotificationPreference[]) => {
    const response = await api.patch<NotificationPreference[]>('/notifications/preferences', {
      preferences,
    });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch<{ success: boolean }>('/notifications/mark-all-read');
    return response.data;
  },
};
