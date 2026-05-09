'use client';

import * as React from 'react';
import Link from 'next/link';
import { Grid3X3, Search, Sparkles } from 'lucide-react';

import { ToolCard } from '@/components/dashboard/ToolCard';
import {
  ALL_TOOLS_LIST,
  CREATOR_TOOL_HIGHLIGHTS,
  TOOL_CATEGORIES,
  socialItems,
} from '@/components/layouts/navigation-data';
import { cn } from '@/lib/utils';

export default function CreatorPage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredTools = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return ALL_TOOLS_LIST.filter((tool) => {
      if (normalizedQuery.length === 0) return true;

      return (
        tool.label.toLowerCase().includes(normalizedQuery) ||
        tool.href.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground pt-8 px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.32em] text-muted-foreground">
            <Grid3X3 className="size-4" />
            All tools
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Creator Tools</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Browse the full tool catalog, jump into Social Hub, or open any creator flow from one place.
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tools?"
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="size-4" />
            Creator tools
          </div>
          <p className="mt-3 text-3xl font-semibold">{ALL_TOOLS_LIST.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Available tool routes in the workspace</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="size-4" />
            Social Hub
          </div>
          <p className="mt-3 text-3xl font-semibold">{socialItems.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Publishing, inbox, calendar, dashboard</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="size-4" />
            Quick access
          </div>
          <p className="mt-3 text-3xl font-semibold">{CREATOR_TOOL_HIGHLIGHTS.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Featured shortcuts on the dashboard</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {CREATOR_TOOL_HIGHLIGHTS.map((tool) => (
          <ToolCard
            key={tool.label}
            icon={tool.icon}
            label={tool.label}
            href={tool.href}
            isNew={tool.isNew}
            color={tool.color}
          />
        ))}
      </div>

      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            <Sparkles className="size-4" />
            Social Hub
          </div>
          <Link href="/social" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Open hub overview
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {socialItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Open page</p>
                  </div>
                </div>
                {item.isNew && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    New
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-8">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = filteredTools.filter((tool) => tool.category === category.id);

          return (
            <section key={category.id} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  <category.icon className="size-4" />
                  {category.label}
                </div>
                <span className="text-xs text-muted-foreground">
                  {categoryTools.length} tool{categoryTools.length === 1 ? '' : 's'}
                </span>
              </div>

              {categoryTools.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {categoryTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className={cn(
                        'group rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5',
                        tool.isNew && 'ring-1 ring-primary/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <tool.icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight">{tool.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Open tool</p>
                          </div>
                        </div>
                        {tool.isNew && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            New
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
                  No tools match this search in this category.
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
