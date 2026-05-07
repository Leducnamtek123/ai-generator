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
  getNotifications: () => get<AdminNotificationFeed>('/admin/notifications'),
};
