import { get } from '@/lib/api';

export type AdminNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  severity: AdminNotificationSeverity;
  category: 'security' | 'moderation' | 'operations' | 'system';
  createdAt: string;
  actionLabel?: string;
  actionHref?: string;
  meta?: Record<string, unknown>;
};

export type AdminNotificationFeed = {
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    success: number;
    unresolved: number;
  };
  data: AdminNotification[];
};

export const adminNotificationApi = {
  getNotifications: (params?: { q?: string; severity?: AdminNotificationSeverity | 'all'; category?: string | 'all' }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return get<AdminNotificationFeed>(`/admin/notifications${suffix}`);
  },
};
