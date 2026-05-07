export enum NotificationCategory {
  PAYMENT = 'payment',
  WORKFLOW = 'workflow',
  SOCIAL = 'social',
  MODERATION = 'moderation',
  SYSTEM = 'system',
}

export const NOTIFICATION_CATEGORIES = [
  NotificationCategory.PAYMENT,
  NotificationCategory.WORKFLOW,
  NotificationCategory.SOCIAL,
  NotificationCategory.MODERATION,
  NotificationCategory.SYSTEM,
] as const;

export type NotificationPreferenceSnapshot = {
  category: NotificationCategory;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  adminAlertsEnabled: boolean;
};

