import { cn } from '@/lib/utils';
import { Skeleton } from '@/ui/skeleton';

export function ToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col rounded-2xl border border-border bg-card p-5', className)}>
      <Skeleton className="mb-4 size-12 rounded-xl" />
      <Skeleton className="mb-2 h-4 w-3/5" />
      <Skeleton className="mb-5 h-3 w-full" />
      <Skeleton className="mt-auto h-3 w-24" />
    </div>
  );
}

export function TemplateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('group flex flex-col gap-2', className)}>
      <Skeleton className="aspect-[16/10] rounded-lg" />
      <div className="flex flex-col px-0.5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
    </div>
  );
}

export function WorkflowCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('group flex flex-col', className)}>
      <Skeleton className="mb-3 aspect-[4/3] w-full rounded-xl" />
      <div className="flex flex-col px-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    </div>
  );
}

export function ProjectCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('group rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="size-5 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProjectCardSkeleton key={`project-skeleton-${index}`} />
      ))}
    </div>
  );
}

export function ProjectListSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={`project-list-skeleton-${index}`} className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MasonryGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const ratios = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-[6/7]', 'aspect-[1/1]'];

  return (
    <div className={cn('columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3 2xl:columns-4', className)}>
      {Array.from({ length: count }, (_, index) => {
        const ratio = ratios[index % ratios.length];

        return (
          <div
            key={`masonry-skeleton-${index}`}
            className="break-inside-avoid mb-5 overflow-hidden rounded-[1.5rem] bg-zinc-950/80 ring-1 ring-white/8"
          >
            <div className={cn('relative overflow-hidden', ratio)}>
              <Skeleton className="absolute inset-0 rounded-none bg-muted/18" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/18 to-transparent" />
              <div className="absolute left-4 top-4">
                <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
              </div>
              <div className="absolute right-4 top-4">
                <Skeleton className="h-6 w-12 rounded-full bg-white/10" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-100 md:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div className="max-w-[70%] space-y-2">
                    <Skeleton className="h-3 w-28 bg-white/10" />
                    <Skeleton className="h-4 w-11/12 bg-white/12" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="size-8 rounded-full bg-white/10" />
                    <Skeleton className="size-8 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MarketplaceListingSkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 2xl:grid-cols-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`marketplace-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm"
        >
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingSummarySkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`listing-summary-skeleton-${index}`}
          className="rounded-xl border border-border/70 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationRowSkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={`notification-skeleton-${index}`} className="flex gap-3 rounded-2xl border border-border/70 p-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VisualFlowProjectSkeletonGrid({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/70 min-h-[260px] p-5 flex flex-col items-center justify-center gap-3">
        <Skeleton className="size-14 rounded-2xl bg-muted/70" />
        <Skeleton className="h-4 w-24 bg-muted/70" />
      </div>
      {Array.from({ length: count - 1 }, (_, index) => (
        <div
          key={`visual-flow-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card/70"
        >
          <Skeleton className="h-36 rounded-none bg-muted/70" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3 bg-muted/70" />
            <Skeleton className="h-3 w-full bg-muted/70" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24 bg-muted/70" />
              <Skeleton className="h-3 w-20 bg-muted/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VisualFlowStudioSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full min-h-screen flex-col overflow-hidden bg-background p-6 text-foreground', className)}>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border/60 bg-card/70">
        <div className="w-56 shrink-0 border-r border-border/60 bg-muted/30 p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-36 rounded-full bg-muted/70" />
            <Skeleton className="h-8 w-full rounded-xl bg-muted/70" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4 bg-muted/70" />
              <Skeleton className="h-6 w-2/3 bg-muted/70" />
              <Skeleton className="h-6 w-1/2 bg-muted/70" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl bg-muted/70" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center gap-3 border-b border-border/60 bg-card/80 px-4">
            <Skeleton className="size-8 rounded-lg bg-muted/70" />
            <Skeleton className="h-4 w-48 bg-muted/70" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-7 w-28 rounded-lg bg-muted/70" />
              <Skeleton className="h-7 w-20 rounded-lg bg-muted/70" />
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-hidden p-5">
            <Skeleton className="h-28 rounded-3xl bg-muted/70" />
            <Skeleton className="h-10 w-80 rounded-full bg-muted/70" />
            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <Skeleton className="h-[24rem] rounded-3xl bg-muted/70" />
              <Skeleton className="h-[24rem] rounded-3xl bg-muted/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceProjectsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-4xl px-4 py-8 sm:px-6', className)}>
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <ProjectListSkeleton count={4} />
      </div>
    </div>
  );
}

export function WorkspaceMembersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-3xl px-4 py-8 sm:px-6', className)}>
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`workspace-member-skeleton-${index}`} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSettingsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-2xl px-4 py-8 sm:px-6', className)}>
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-6">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceBillingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-4xl px-4 py-8 sm:px-6', className)}>
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-10 w-40" />
          <Skeleton className="mt-3 h-4 w-56" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`workspace-billing-plan-${index}`} className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceInvitesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-3xl px-4 py-8 sm:px-6', className)}>
      <div className="mb-8 space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-5 w-28" />
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_128px]">
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
            <Skeleton className="h-11 rounded-lg" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`workspace-invite-skeleton-${index}`} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InviteAcceptSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-background p-4', className)}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <Skeleton className="h-32 rounded-none" />
        <div className="space-y-5 px-8 pb-8 pt-12 text-center">
          <div className="space-y-2">
            <Skeleton className="mx-auto h-6 w-32" />
            <Skeleton className="mx-auto h-4 w-48" />
          </div>
          <div className="rounded-xl bg-muted/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2 text-left">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistorySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-9 w-56 rounded-lg" />
          </div>
        </div>

        <div className="space-y-10">
          {Array.from({ length: 4 }, (_, groupIndex) => (
            <section key={`history-skeleton-group-${groupIndex}`}>
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-10" />
              </div>

              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={`history-skeleton-item-${groupIndex}-${index}`} className="flex h-24 items-center gap-6 rounded-xl border border-border bg-card p-4">
                    <Skeleton className="h-full w-32 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-12 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="flex gap-2 opacity-70">
                      <Skeleton className="size-8 rounded-lg" />
                      <Skeleton className="size-8 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <div className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        <div className="px-8 flex items-center gap-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <WorkflowCardSkeleton key={`project-detail-skeleton-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <div className="border-b border-border bg-gradient-to-r from-background via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Skeleton className="h-5 w-44 rounded-full" />
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-4 w-[32rem] max-w-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`notifications-stat-skeleton-${index}`} className="rounded-3xl border border-border bg-card p-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-10 w-16" />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-2">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={`notifications-tab-skeleton-${index}`} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <NotificationRowSkeletonList count={5} />
        </div>
      </div>
    </div>
  );
}

export function SocialCalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <div className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-11 w-96" />
              <Skeleton className="h-4 w-[34rem] max-w-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-9 w-36 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-3">
              {Array.from({ length: 35 }, (_, index) => (
                <div key={`calendar-grid-skeleton-${index}`} className="min-h-28 rounded-2xl border border-border/70 bg-background p-3">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-44" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={`calendar-side-skeleton-${index}`} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
