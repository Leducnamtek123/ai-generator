'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import {
    ChevronRight,
    Code,
    Copy,
    ExternalLink,
    MessageSquare,
    Search,
    Server,
    ShieldCheck,
    Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { apiEndpointGroups as rawApiEndpointGroups } from '@/content/api-endpoints.generated';

type ApiEndpointItem = {
    method: string;
    path: string;
    summary: string;
    source: string;
    operation: string;
};

type ApiEndpointGroup = {
    tag: string;
    description: string;
    items: ApiEndpointItem[];
};

const apiEndpointGroups = rawApiEndpointGroups as unknown as ApiEndpointGroup[];

const sectionLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'mcp', label: 'MCP setup' },
    { id: 'auth', label: 'Authentication' },
    { id: 'endpoints', label: 'Endpoint catalog' },
    { id: 'support', label: 'Support' },
] as const;

function getMethodBadgeClass(method: string) {
    switch (method) {
        case 'GET':
            return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'POST':
            return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
        case 'PUT':
            return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'PATCH':
            return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
        case 'DELETE':
            return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
}

function buildMcpConfig(origin: string) {
    return `{
  "mcpServers": {
    "paintai": {
      "command": "npx",
      "args": ["-y", "@paintai/mcp-server"],
      "env": {
        "API_BASE_URL": "${origin}/api/v1",
        "API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}`;
}

function useClientOrigin() {
    return useSyncExternalStore(
        () => () => undefined,
        () => window.location.origin,
        () => 'http://localhost:3000',
    );
}

export default function ApiDocsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const origin = useClientOrigin();

    const totalRoutes = apiEndpointGroups.reduce(
        (count: number, group: ApiEndpointGroup) => count + group.items.length,
        0,
    );
    const totalTags = apiEndpointGroups.length;

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return apiEndpointGroups;
        }

        return apiEndpointGroups
            .map((group) => {
                const items = group.items.filter((item) => {
                    const haystack = [
                        group.tag,
                        item.method,
                        item.path,
                        item.summary,
                        item.source,
                        item.operation,
                    ]
                        .join(' ')
                        .toLowerCase();

                    return haystack.includes(query);
                });

                return {
                    ...group,
                    items,
                };
            })
            .filter((group) => group.items.length > 0);
    }, [search]);

    const visibleRoutes = filteredGroups.reduce(
        (count: number, group: ApiEndpointGroup) => count + group.items.length,
        0,
    );

    const copyToClipboard = (text: string, message = 'Copied to clipboard') => {
        void navigator.clipboard.writeText(text);
        toast.success(message);
    };

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] self-start overflow-hidden rounded-3xl border border-border bg-card/80 p-4 backdrop-blur xl:flex xl:flex-col">
                        <div className="space-y-4 border-b border-border pb-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                                <Code className="h-3 w-3" />
                                Developer Platform
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tight">API & MCP Docs</h1>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Generated from backend controllers and route decorators. No manual Swagger loading.
                                </p>
                            </div>
                        </div>

                        <nav className="mt-4 space-y-1">
                            {sectionLinks.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollToSection(item.id)}
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <span>{item.label}</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            ))}
                        </nav>

                        <div className="mt-4 space-y-3 border-t border-border pt-4">
                            <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Loaded routes
                                </p>
                                <p className="mt-2 text-3xl font-black">{totalRoutes}</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    All documented API endpoints grouped by tag.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    OpenAPI source
                                </p>
                                <p className="mt-2 text-sm font-semibold">Backend controllers</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Generated from `backend/src/**/*.controller.ts`.
                                </p>
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-6">
                        <section
                            id="overview"
                            className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(47,102,255,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                                    <Code className="h-3 w-3" />
                                    Developer Platform
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    <Server className="h-3 w-3" />
                                    {totalRoutes} endpoints
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    <ShieldCheck className="h-3 w-3" />
                                    {totalTags} tags
                                </div>
                            </div>

                            <div className="mt-5 max-w-4xl">
                                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                                    API & MCP Documentation
                                </h1>
                                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                                    This page no longer depends on the live Swagger UI being reachable. It pulls the
                                    endpoint catalog from the backend controller source so every API surface is shown
                                    automatically when the docs page opens.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button onClick={() => scrollToSection('endpoints')} className="gap-2">
                                    <Search className="h-4 w-4" />
                                    Browse endpoints
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => scrollToSection('mcp')}
                                    className="gap-2"
                                >
                                    <Terminal className="h-4 w-4" />
                                    MCP setup
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push('/settings?tab=api')}
                                    className="gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    Get API key
                                </Button>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card/80 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        MCP
                                    </p>
                                    <p className="mt-2 text-sm font-semibold">Claude Desktop ready</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Copy the config and point `API_BASE_URL` to your local origin.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card/80 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        REST API
                                    </p>
                                    <p className="mt-2 text-sm font-semibold">{totalRoutes} documented routes</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Grouped directly from the backend controller files.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card/80 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Live load
                                    </p>
                                    <p className="mt-2 text-sm font-semibold">No manual loading required</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Search and browse the whole API surface immediately.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section
                            id="mcp"
                            className="grid gap-6 rounded-[2rem] border border-border bg-card p-6 lg:grid-cols-[1.1fr_minmax(0,0.9fr)]"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
                                        <Terminal className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Connect via MCP</h2>
                                </div>
                                <p className="text-sm leading-7 text-muted-foreground">
                                    MCP lets Claude Desktop and other agents talk to the platform directly using your
                                    API key.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-semibold">1. Open Claude Desktop config</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Windows: <code>%APPDATA%/Claude/claude_desktop_config.json</code>
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold">2. Add PaintAI server</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            The config below already points `API_BASE_URL` to the current origin.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-3xl border border-border bg-black/90">
                                <pre className="overflow-x-auto p-5 text-[11px] leading-6 text-green-400">
                                    {buildMcpConfig(origin)}
                                </pre>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute right-3 top-3 h-8 text-[10px]"
                                    onClick={() => copyToClipboard(buildMcpConfig(origin))}
                                >
                                    <Copy className="mr-2 h-3 w-3" />
                                    Copy JSON
                                </Button>
                            </div>
                        </section>

                        <section
                            id="auth"
                            className="grid gap-6 rounded-[2rem] border border-border bg-card p-6 lg:grid-cols-2"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                        <Server className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Authentication</h2>
                                </div>
                                <p className="text-sm leading-7 text-muted-foreground">
                                    Use the `X-API-KEY` header for programmatic access. Generate the key in the
                                    settings page and reuse it in MCP or direct API clients.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={() => router.push('/settings?tab=api')} className="gap-2">
                                        <Terminal className="h-4 w-4" />
                                        Get API key
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => copyToClipboard('X-API-KEY', 'Header name copied')}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy header name
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-border bg-muted/30 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    How to call the API
                                </p>
                                <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background p-4 text-[11px] leading-6 text-foreground">
{`curl -X GET "${origin}/api/v1/templates" \\
  -H "X-API-KEY: YOUR_API_KEY_HERE"`}
                                </pre>
                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Endpoint groups below are generated from the backend source tree.
                                </div>
                            </div>
                        </section>

                        <section id="endpoints" className="space-y-4 rounded-[2rem] border border-border bg-card p-6">
                            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Endpoint catalog</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Search across methods, paths, summaries, and source files. No manual loading is
                                        required.
                                    </p>
                                </div>
                                <div className="w-full sm:max-w-sm">
                                    <Input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search endpoints, tags, paths..."
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    Showing {visibleRoutes} / {totalRoutes} routes
                                </span>
                                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {filteredGroups.length} tag groups
                                </span>
                            </div>

                            {filteredGroups.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                                    No endpoints matched your search.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredGroups.map((group) => (
                                        <details
                                            key={group.tag}
                                            className="group rounded-2xl border border-border bg-muted/20 p-4"
                                            open={group.items.length <= 6}
                                        >
                                            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-base font-bold">{group.tag}</h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {group.items.length} documented operation
                                                        {group.items.length > 1 ? 's' : ''}.
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                                                    {group.items.length}
                                                </span>
                                            </summary>

                                            <div className="mt-4 space-y-3">
                                                {group.items.map((item) => (
                                                    <div
                                                        key={`${item.method}:${item.path}:${item.operation}`}
                                                        className="rounded-2xl border border-border bg-card p-4"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span
                                                                className={cn(
                                                                    'rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                                                                    getMethodBadgeClass(item.method),
                                                                )}
                                                            >
                                                                {item.method}
                                                            </span>
                                                            <code className="text-sm font-semibold text-foreground">
                                                                {item.path}
                                                            </code>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                            {item.summary}
                                                        </p>
                                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                                                            <span>{item.source}</span>
                                                            <span>•</span>
                                                            <span>{item.operation}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section id="support" className="rounded-[2rem] border border-border bg-card p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Need help?</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Contact developer support or jump to community resources from here.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Community Discord
                                    </Button>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        GitHub Examples
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
}
