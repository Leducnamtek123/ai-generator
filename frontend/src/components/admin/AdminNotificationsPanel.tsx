'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/navigation';
import {
  adminNotificationApi,
  type AdminNotification,
  type AdminNotificationSeverity,
} from '@/services/adminNotificationApi';

const severityMeta: Record<
  AdminNotificationSeverity,
  { label: string; className: string; icon: React.ElementType }
> = {
  critical: { label: 'Critical', className: 'bg-red-500/15 text-red-500 border-red-500/20', icon: ShieldAlert },
  warning: { label: 'Warning', className: 'bg-amber-500/15 text-amber-500 border-amber-500/20', icon: AlertCircle },
  info: { label: 'Info', className: 'bg-primary/15 text-primary border-primary/20', icon: Sparkles },
  success: { label: 'Resolved', className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
};

const filterOptions: Array<'all' | AdminNotificationSeverity> = ['all', 'critical', 'warning', 'info', 'success'];

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleDateString();
};

const NotificationRow = ({
  item,
  onOpen,
}: {
  item: AdminNotification;
  onOpen: (href: string) => void;
}) => {
  const meta = severityMeta[item.severity];
  const Icon = meta.icon;
  const action = typeof item.meta?.action === 'string' ? item.meta.action : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-border/70 md:flex-row md:items-start md:justify-between">
      <div className="flex gap-3">
        <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', meta.className)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{item.title}</p>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]', meta.className)}>
              {meta.label}
            </span>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.category}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{item.message}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" />
              {formatRelativeTime(item.createdAt)}
            </span>
            {action && (
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px]">
                {action}
              </span>
            )}
          </div>
        </div>
      </div>
      {item.actionHref && item.actionLabel && (
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => onOpen(item.actionHref!)}>
          {item.actionLabel}
        </Button>
      )}
    </div>
  );
};

export function AdminNotificationsPanel() {
  const { push } = useRouter();
  const [severityFilter, setSeverityFilter] = React.useState<'all' | AdminNotificationSeverity>('all');

  const query = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: adminNotificationApi.getNotifications,
    staleTime: 30_000,
  });

  const feed = query.data?.data ?? [];
  const summary = query.data?.summary;
  const visibleFeed = severityFilter === 'all' ? feed : feed.filter((item) => item.severity === severityFilter);

  return (
    <Card className="rounded-lg border-border">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Notifications</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              A live feed of moderation, security, and operational alerts for the admin team.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => push('/admin')}>
              Back to admin
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {filterOptions.map((item) => {
            const active = severityFilter === item;
            const label =
              item === 'all' ? 'All' : severityMeta[item].label;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSeverityFilter(item)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50',
                )}
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold">
                  {item === 'all' ? summary?.total ?? feed.length : summary?.[item] ?? 0}
                </div>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {query.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        )}

        {!query.isLoading && visibleFeed.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldAlert className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No alerts in this view</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              When moderation, catalog, or security events happen, they will show up here with a clear severity and action.
            </p>
          </div>
        )}

        {!query.isLoading &&
          visibleFeed.map((item) => (
            <NotificationRow key={item.id} item={item} onOpen={(href) => push(href)} />
          ))}

        {summary && (
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Unresolved</p>
              <p className="mt-1 text-2xl font-semibold">{summary.unresolved}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Critical</p>
              <p className="mt-1 text-2xl font-semibold text-red-500">{summary.critical}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Warnings</p>
              <p className="mt-1 text-2xl font-semibold text-amber-500">{summary.warning}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
