'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  Inbox,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { notificationApi, type Notification } from '@/services/notificationApi';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'success', label: 'Success' },
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'error', label: 'Error' },
] as const;

type FilterId = (typeof tabs)[number]['id'];

const typeMeta = {
  success: {
    icon: Sparkles,
    accent: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
    label: 'Success',
  },
  info: {
    icon: Bell,
    accent: 'bg-primary/15 text-primary border-primary/25',
    label: 'Info',
  },
  warning: {
    icon: ShieldAlert,
    accent: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
    label: 'Warning',
  },
  error: {
    icon: Wrench,
    accent: 'bg-red-500/15 text-red-500 border-red-500/25',
    label: 'Error',
  },
} satisfies Record<Notification['type'], { icon: React.ElementType; accent: string; label: string }>;

const categoryMeta: Record<Notification['category'], { label: string }> = {
  payment: { label: 'Payment' },
  workflow: { label: 'Workflow' },
  social: { label: 'Social' },
  moderation: { label: 'Moderation' },
  system: { label: 'System' },
};

const relativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

const EmptyState = () => (
  <Card className="overflow-hidden rounded-3xl border-border">
    <div className="bg-gradient-to-br from-primary/15 via-background to-chart-2/10 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/80 shadow-sm">
          <Inbox className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold">No notifications yet</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          SaaS products usually keep this screen as an inbox: product events, billing updates, moderation changes, and admin alerts all land here in one place.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/settings?tab=notifications">
            <Button variant="default">Open notification settings</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Open admin console</Button>
          </Link>
        </div>
      </div>
    </div>
    <CardContent className="grid gap-3 border-t border-border bg-card/60 px-6 py-5 md:grid-cols-3">
      {[
        { title: 'Activity feed', note: 'Issue updates, publish runs, workflow events.' },
        { title: 'Billing & account', note: 'Payments, credits, access changes.' },
        { title: 'Admin alerts', note: 'Errors, moderation, import or approval events.' },
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
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
}) => {
  const meta = typeMeta[item.type];
  const Icon = meta.icon;

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
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{item.title}</p>
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]', meta.accent)}>
                {meta.label}
              </span>
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {categoryMeta[item.category].label}
              </span>
              {!item.isRead && (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  New
                </span>
              )}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.message}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {relativeTime(item.createdAt)}
              </span>
              {item.isRead && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Read</span>}
            </div>
          </div>
        </div>
        {!item.isRead ? (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
            Mark as read
          </div>
        ) : null}
      </div>
    </button>
  );
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = React.useState<FilterId>('all');

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
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Bell className="h-3.5 w-3.5 text-primary" />
                Notification center
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                One inbox for product updates and admin alerts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Keep billing, workflow, moderation, and platform alerts in one feed. This mirrors the common SaaS pattern: a quick unread badge in the header, plus a dedicated inbox for the full history.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
                <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} />
                Refresh
              </Button>
              <Button onClick={() => void markAllRead()} disabled={unreadCount === 0 || query.isFetching}>
                Mark all as read
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-3xl border-border">
            <CardHeader className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unread</p>
              <CardTitle className="text-3xl">{counts.unread}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl border-border">
            <CardHeader className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Success</p>
              <CardTitle className="text-3xl text-emerald-500">{counts.success}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl border-border">
            <CardHeader className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Warnings</p>
              <CardTitle className="text-3xl text-amber-500">{counts.warning}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl border-border">
            <CardHeader className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Errors</p>
              <CardTitle className="text-3xl text-red-500">{counts.error}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-3xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </div>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? items.length
                    : tab.id === 'unread'
                      ? counts.unread
                      : counts[tab.id];
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                      active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50',
                    )}
                  >
                    <span className="font-medium">{tab.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
              A strong notification center usually keeps the first glance simple, then lets the user drill into unread, type, and admin/system activity without losing the feed.
            </div>
          </aside>

          <main className="space-y-4">
            {query.isLoading ? (
              <div className="space-y-3">
                <Card className="h-28 rounded-3xl border-border" />
                <Card className="h-28 rounded-3xl border-border" />
                <Card className="h-28 rounded-3xl border-border" />
              </div>
            ) : visibleItems.length === 0 ? (
              <EmptyState />
            ) : (
              visibleItems.map((item) => (
                <NotificationRow key={item.id} item={item} onMarkRead={markRead} />
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
