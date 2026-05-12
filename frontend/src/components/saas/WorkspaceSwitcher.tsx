'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { workspaceApi, type Workspace } from '@/services/workspaceApi';

import {
  Check,
  ChevronsUpDown,
  Home,
  Plus,
  Search,
  Users,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';

const personalItem = {
  id: 'personal',
  name: 'Personal project',
  slug: 'personal',
};

export function WorkspaceSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentWorkspace,
    workspaces,
    setCurrentWorkspace,
    setWorkspaces,
    setCurrentMembership,
  } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const isWorkspaceRoute = pathname.startsWith('/workspaces/');
  const activeWorkspaceSlug = isWorkspaceRoute ? pathname.split('/')[2] ?? '' : '';
  const activeWorkspace =
    workspaces.find((workspace) => workspace.slug === activeWorkspaceSlug) ?? currentWorkspace;

  const currentLabel = isWorkspaceRoute
    ? activeWorkspace?.name ?? 'Workspace'
    : 'Personal';
  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const nextWorkspaces = await workspaceApi.list();
      setWorkspaces(nextWorkspaces);

      if (isWorkspaceRoute && activeWorkspaceSlug) {
        const routeWorkspace = nextWorkspaces.find((workspace) => workspace.slug === activeWorkspaceSlug);
        if (routeWorkspace) {
          setCurrentWorkspace(routeWorkspace);
          try {
            const membership = await workspaceApi.getMembership(routeWorkspace.slug);
            setCurrentMembership(membership.member);
          } catch {
            // Ignore membership loading failures here.
          }
        }
      } else if (!currentWorkspace && nextWorkspaces.length > 0) {
        setCurrentWorkspace(nextWorkspaces[0]);
        try {
          const membership = await workspaceApi.getMembership(nextWorkspaces[0].slug);
          setCurrentMembership(membership.member);
        } catch {
          // Ignore membership loading failures here.
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceSlug, currentWorkspace, isWorkspaceRoute, setCurrentMembership, setCurrentWorkspace, setWorkspaces]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadWorkspaces();
    });
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const selectPersonal = () => {
    setCurrentWorkspace(null);
    setCurrentMembership(null);
    setIsOpen(false);
    router.push('/dashboard');
  };

  const selectWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
    router.push(`/workspaces/${workspace.slug}/projects`);
    try {
      const membership = await workspaceApi.getMembership(workspace.slug);
      setCurrentMembership(membership.member);
    } catch {
      // Keep the context switch even if membership refresh fails.
    }
  };

  const filteredWorkspaces = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return workspaces;
    return workspaces.filter((workspace) =>
      [workspace.name, workspace.slug, workspace.description, workspace.domain ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, workspaces]);

  const selectedWorkspaceId = isWorkspaceRoute ? activeWorkspace?.id : null;

  if (isCollapsed) {
    return (
      <div className="relative flex justify-center py-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="size-9 rounded-xl border border-sidebar-border bg-sidebar-accent/60 flex items-center justify-center text-sidebar-foreground shadow-sm transition-all hover:bg-sidebar-accent"
          aria-label="Open workspace switcher"
        >
          <span className="sr-only">{currentLabel}</span>
          <span className="size-4 rounded-md bg-gradient-to-br from-orange-400 to-amber-500" />
        </button>

        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Close workspace switcher"
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-2 right-2 top-full z-50 mt-2 rounded-3xl border border-border bg-popover p-2 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
              <SwitcherPanel
                loading={loading}
                query={query}
                onQueryChange={setQuery}
                filteredWorkspaces={filteredWorkspaces}
                selectedWorkspaceId={selectedWorkspaceId}
                onSelectPersonal={selectPersonal}
                onSelectWorkspace={selectWorkspace}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-left transition-all duration-200',
          'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          isOpen && 'bg-sidebar-accent text-sidebar-foreground',
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-[10px] font-bold text-white shadow-sm">
          {isWorkspaceRoute ? (activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'T') : 'P'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{currentLabel}</div>
        </div>
        <ChevronsUpDown className={cn('size-4 shrink-0 text-sidebar-foreground/40 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close workspace switcher"
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-3xl border border-border bg-popover p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <SwitcherPanel
              loading={loading}
              query={query}
              onQueryChange={setQuery}
              filteredWorkspaces={filteredWorkspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              onSelectPersonal={selectPersonal}
              onSelectWorkspace={selectWorkspace}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SwitcherPanel({
  loading,
  query,
  onQueryChange,
  filteredWorkspaces,
  selectedWorkspaceId,
  onSelectPersonal,
  onSelectWorkspace,
  onClose,
}: {
  loading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  filteredWorkspaces: Workspace[];
  selectedWorkspaceId: string | null | undefined;
  onSelectPersonal: () => void;
  onSelectWorkspace: (workspace: Workspace) => void;
  onClose: () => void;
}) {
  const hasMatches = filteredWorkspaces.length > 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search projects"
          size="sm"
          className="h-11 rounded-2xl border-border bg-background/70 pl-9 text-sm shadow-sm"
        />
      </div>

      <div className="space-y-1.5 rounded-2xl border border-border bg-background/45 p-2">
        <div className="px-2 pt-1 text-sm font-medium text-muted-foreground">
          Personal
        </div>
        <Link
          href="/dashboard"
          onClick={() => {
            onSelectPersonal();
            onClose();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
            !selectedWorkspaceId
              ? 'bg-muted text-foreground'
              : 'hover:bg-muted/70 text-foreground/90',
          )}
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 text-white">
            <Home className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Personal project</div>
            <div className="truncate text-xs text-muted-foreground">Your private workspace</div>
          </div>
          {!selectedWorkspaceId && <Check className="size-4 text-primary" />}
        </Link>

        <div className="px-2 pt-2 text-sm font-medium text-muted-foreground">
          Team workspaces
        </div>

        {loading ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">Loading workspaces...</div>
        ) : hasMatches ? (
          filteredWorkspaces.map((workspace) => {
            const active = selectedWorkspaceId === workspace.id;

            return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.slug}/projects`}
                onClick={() => onSelectWorkspace(workspace)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                  active ? 'bg-muted text-foreground' : 'hover:bg-muted/70 text-foreground/90',
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white shadow-sm">
                  {workspace.name?.charAt(0)?.toUpperCase() || 'W'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{workspace.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {workspace.description || 'Team project'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  {active && <Check className="size-4 text-primary" />}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            No workspace matches your search.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background/45 px-3 py-2">
        <div className="text-xs text-muted-foreground">Create or manage workspaces</div>
        <Link
          href="/workspaces/new"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>
    </div>
  );
}
