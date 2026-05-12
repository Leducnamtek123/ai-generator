'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  Clock3,
  Inbox,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { notificationApi, type Notification } from '@/services/notificationApi';
import { NotificationsSkeleton } from '@/components/common/loading-skeletons';

type NotificationsT = (key: string) => string;

const EmptyState = ({ t }: { t: NotificationsT }) => (
  <Card className="overflow-hidden rounded-3xl border-border">
    <div className="bg-gradient-to-br from-primary/15 via-background to-chart-2/10 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-background/80 shadow-sm">
          <Inbox className="size-6 text-primary" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold">{t('emptyTitle')}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t('emptyBody')}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/settings?tab=notifications">
            <Button variant="default">{t('openSettings')}</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">{t('openAdmin')}</Button>
          </Link>
        </div>
      </div>
    </div>
    <CardContent className="grid gap-3 border-t border-border bg-card/60 px-6 py-5 md:grid-cols-3">
      {[
        { title: t('cards.activityFeed'), note: t('cards.activityFeedNote') },
        { title: t('cards.billingAccount'), note: t('cards.billingAccountNote') },
        { title: t('cards.adminAlerts'), note: t('cards.adminAlertsNote') },
      ].map((item) => (
        <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

const NotificationRow = ({
  item,
  onMarkRead,
  t,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
  t: NotificationsT;
}) => {
  const meta = (() => {
    switch (item.type) {
      case 'success':
        return { icon: Sparkles, accent: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25', label: t('success') };
      case 'info':
        return { icon: Bell, accent: 'bg-primary/15 text-primary border-primary/25', label: t('info') };
      case 'warning':
        return { icon: ShieldAlert, accent: 'bg-amber-500/15 text-amber-500 border-amber-500/25', label: t('warnings') };
      default:
        return { icon: Wrench, accent: 'bg-red-500/15 text-red-500 border-red-500/25', label: t('error') };
    }
  })();
  const Icon = meta.icon;
  const categoryLabel = t(`categories.${item.category}`);

  return (
    <button
      type="button"
      onClick={() => onMarkRead(item.id)}
      className={cn(
        'group w-full rounded-3xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        !item.isRead && 'ring-1 ring-primary/10',
        item.isRead && 'opacity-75',
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className={cn('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border', meta.accent)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{item.title}</p>
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', meta.accent)}>
                {meta.label}
              </span>
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {categoryLabel}
              </span>
              {!item.isRead && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {t('unread')}
                </span>
              )}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                {new Date(item.createdAt).toLocaleString()}
              </span>
              {item.isRead && <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" /> Read</span>}
            </div>
          </div>
        </div>
        {!item.isRead ? (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
            {t('actions.markAsRead')}
          </div>
        ) : null}
      </div>
    </button>
  );
};

export default function NotificationsPage() {
  const t = useTranslations('Notifications');
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread' | 'success' | 'info' | 'warning' | 'error'>('all');

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(1, 50),
    staleTime: 15_000,
  });

  const items = query.data ?? [];
  const unreadCount = items.filter((item) => !item.isRead).length;
  const counts = items.reduce(
    (acc, item) => {
      acc[item.type] += 1;
      if (!item.isRead) acc.unread += 1;
      return acc;
    },
    {
      success: 0,
      info: 0,
      warning: 0,
      error: 0,
      unread: 0,
    },
  );

  const visibleItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !item.isRead;
    return item.type === activeTab;
  });

  if (query.isLoading && items.length === 0) {
    return <NotificationsSkeleton />;
  }

  const markAllRead = async () => {
    await notificationApi.markAllAsRead();
    await query.refetch();
  };

  const markRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    await query.refetch();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-gradient-to-r from-background via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
                <Bell className="size-3.5 text-primary" />
                {t('notificationCenter')}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {t('headline')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                {t('description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
                <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} />
                {t('refresh')}
              </Button>
              <Button onClick={() => void markAllRead()} disabled={unreadCount === 0 || query.isFetching}>
                {t('markAllAsRead')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { title: t('unread'), value: counts.unread },
            { title: t('success'), value: counts.success, valueClassName: 'text-emerald-500' },
            { title: t('warnings'), value: counts.warning, valueClassName: 'text-amber-500' },
            { title: t('error'), value: counts.error, valueClassName: 'text-red-500' },
          ].map((item) => (
            <Card key={item.title} className="rounded-3xl border-border">
              <CardHeader className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <CardTitle className={cn('text-3xl', item.valueClassName)}>{item.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-2">
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'success', 'info', 'warning', 'error'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'all' ? t('filters.all') : t(`filters.${tab}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {visibleItems.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            visibleItems.map((item) => (
              <NotificationRow key={item.id} item={item} onMarkRead={markRead} t={t} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
