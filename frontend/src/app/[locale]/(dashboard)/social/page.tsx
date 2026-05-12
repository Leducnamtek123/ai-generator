'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
    BarChart3,
    CheckCircle2,
    Clock3,
    MessageSquare,
    RefreshCcw,
    Share2,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react';

import { GlassCard } from '@/components/ui/glass-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    socialHubApi,
    type SocialAnalytics,
    type SocialChannel,
    type SocialInteraction,
    type SocialPost,
} from '@/services/socialHubApi';

const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false });
const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), {
    ssr: false,
});
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });

type OverviewState = {
    analytics: SocialAnalytics | null;
    channels: SocialChannel[];
    posts: SocialPost[];
    inbox: SocialInteraction[];
    isLoading: boolean;
    error: string | null;
};

const initialState: OverviewState = {
    analytics: null,
    channels: [],
    posts: [],
    inbox: [],
    isLoading: true,
    error: null,
};

const platformMeta: Record<
    string,
    { icon: LucideIcon; color: string; label: string }
> = {
    facebook: { icon: Share2, color: '#1877F2', label: 'Facebook' },
    instagram: { icon: Share2, color: '#E4405F', label: 'Instagram' },
    linkedin: { icon: Share2, color: '#0A66C2', label: 'LinkedIn' },
    x: { icon: Share2, color: '#FFFFFF', label: 'X' },
    twitter: { icon: Share2, color: '#FFFFFF', label: 'X' },
};

const statusMeta: Record<
    SocialPost['status'],
    { label: string; color: string; background: string }
> = {
    draft: {
        label: 'Draft',
        color: '#F59E0B',
        background: 'rgba(245, 158, 11, 0.12)',
    },
    scheduled: {
        label: 'Scheduled',
        color: '#60A5FA',
        background: 'rgba(96, 165, 250, 0.12)',
    },
    published: {
        label: 'Published',
        color: '#22C55E',
        background: 'rgba(34, 197, 94, 0.12)',
    },
    failed: {
        label: 'Failed',
        color: '#EF4444',
        background: 'rgba(239, 68, 68, 0.12)',
    },
};

type RecentPostCard = NonNullable<NonNullable<SocialAnalytics['recentPosts']>>[number];

const numberFormatter = new Intl.NumberFormat('en-US');
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

function formatCount(value: number) {
    return numberFormatter.format(value);
}

function formatDate(value?: string | null) {
    if (!value) return 'Not scheduled';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : longDateFormatter.format(parsed);
}

function getPostSnippet(content: string) {
    const cleaned = content.trim().replace(/\s+/g, ' ');
    return cleaned.length > 96 ? `${cleaned.slice(0, 96)}…` : cleaned;
}

function getStatusBadgeStyle(status: SocialPost['status']) {
    const meta = statusMeta[status];
    return {
        backgroundColor: meta.background,
        color: meta.color,
        borderColor: meta.color,
    };
}

function OverviewSkeleton() {
    return (
        <div className="mx-auto max-w-7xl space-y-8 p-8">
            <div className="rounded-[2rem] border border-border/60 bg-card/70 p-8">
                <div className="h-4 w-40 rounded-full bg-muted/70" />
                <div className="mt-4 h-12 w-[28rem] max-w-full rounded-2xl bg-muted/70" />
                <div className="mt-4 h-5 w-[38rem] max-w-full rounded-2xl bg-muted/70" />
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-16 rounded-2xl bg-muted/50" />
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-border/60 bg-card/70 p-6">
                        <div className="h-3 w-20 rounded-full bg-muted/70" />
                        <div className="mt-4 h-10 w-28 rounded-2xl bg-muted/70" />
                        <div className="mt-3 h-4 w-36 rounded-full bg-muted/70" />
                    </div>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6">
                    <div className="h-4 w-28 rounded-full bg-muted/70" />
                    <div className="mt-4 h-8 w-60 rounded-2xl bg-muted/70" />
                    <div className="mt-4 h-[360px] rounded-3xl bg-card/60" />
                </div>
                <div className="rounded-[2rem] border border-border/60 bg-card/70 p-6">
                    <div className="h-4 w-36 rounded-full bg-muted/70" />
                    <div className="mt-4 h-[360px] rounded-3xl bg-card/60" />
                </div>
            </div>
        </div>
    );
}

export default function SocialHubOverviewPage() {
    const [daysRange, setDaysRange] = React.useState<7 | 30>(7);
    const [state, setState] = React.useState<OverviewState>(initialState);

    React.useEffect(() => {
        let active = true;

        const loadOverview = async () => {
            setState((current) => ({
                ...current,
                isLoading: true,
                error: null,
            }));

            const results = await Promise.allSettled([
                socialHubApi.getAnalytics(daysRange),
                socialHubApi.getChannels(),
                socialHubApi.getPosts(),
                socialHubApi.getInbox(),
            ]);

            if (!active) {
                return;
            }

            const [analyticsResult, channelsResult, postsResult, inboxResult] = results;
            const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
            const channels = channelsResult.status === 'fulfilled' ? channelsResult.value : [];
            const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
            const inbox = inboxResult.status === 'fulfilled' ? inboxResult.value : [];
            const errors = [analyticsResult, channelsResult, postsResult, inboxResult]
                .filter((result) => result.status === 'rejected')
                .map((result) => (result.status === 'rejected' ? String(result.reason) : ''))
                .filter(Boolean);

            setState({
                analytics,
                channels,
                posts,
                inbox,
                isLoading: false,
                error: errors.length > 0 ? 'Some live data blocks failed to load. The available metrics are still rendered.' : null,
            });
        };

        void loadOverview();

        return () => {
            active = false;
        };
    }, [daysRange]);

    if (state.isLoading) {
        return <OverviewSkeleton />;
    }

    const analytics = state.analytics;
    const posts = state.posts;
    const channels = state.channels;
    const inbox = state.inbox;

    const chartData = analytics?.chartData ?? [];
    const totalEngagement = analytics ? analytics.totals.likes + analytics.totals.comments + analytics.totals.shares : 0;
    const totalViews = analytics?.totals.views ?? 0;
    const publishedPosts = posts.filter((post) => post.status === 'published');
    const scheduledPosts = posts.filter((post) => post.status === 'scheduled');
    const draftPosts = posts.filter((post) => post.status === 'draft');
    const failedPosts = posts.filter((post) => post.status === 'failed');
    const attentionItems = inbox.filter((item) => item.isNew || item.followUp);
    const reauthNeeded = channels.filter((channel) => channel.needsReauth).length;
    const uniquePlatforms = new Set(channels.map((channel) => channel.platform)).size;

    const platformBreakdown = Object.entries(analytics?.platformBreakdown ?? {})
        .map(([platform, value]) => {
            const meta = platformMeta[platform] ?? {
                icon: Share2,
                color: '#94A3B8',
                label: platform,
            };
            const totalPosts = analytics?.totals.totalPosts ?? 0;
            const share = totalPosts > 0 ? Math.round((value.posts / totalPosts) * 100) : 0;
            return {
                platform,
                label: meta.label,
                color: meta.color,
                icon: meta.icon,
                ...value,
                share,
            };
        })
        .sort((left, right) => right.posts - left.posts);

    const statusData = [
        { name: 'Published', value: publishedPosts.length, color: '#22C55E' },
        { name: 'Scheduled', value: scheduledPosts.length, color: '#60A5FA' },
        { name: 'Draft', value: draftPosts.length, color: '#F59E0B' },
        { name: 'Failed', value: failedPosts.length, color: '#EF4444' },
    ].filter((item) => item.value > 0);
    const statusTotal = statusData.reduce((sum, item) => sum + item.value, 0);

    const peakPoint = chartData.length > 0
        ? chartData.reduce((best, item) => (item.engagement > best.engagement ? item : best))
        : null;

    const trendDelta = chartData.length > 1 && chartData[0]
        ? chartData[chartData.length - 1].engagement - chartData[0].engagement
        : 0;

    const topRecentPosts = ([...(analytics?.recentPosts ?? [])] as RecentPostCard[])
        .sort((left, right) => {
            const leftStamp = new Date(left.publishedAt ?? '').getTime();
            const rightStamp = new Date(right.publishedAt ?? '').getTime();
            return rightStamp - leftStamp;
        })
        .slice(0, 6);

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-8">
            <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-[0_0_80px_rgba(59,130,246,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_36%)]" />
                <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-semibold tracking-tight">Workspace analytics</h1>
                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                This surface is powered by real analytics, connected accounts, inbox pressure, and posting activity.
                                No hard-coded action cards, only operational data.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="min-w-[180px]">
                                <Select value={String(daysRange)} onValueChange={(value) => setDaysRange(value === '30' ? 30 : 7)}>
                                    <SelectTrigger className="border-border/60 bg-background/60">
                                        <SelectValue placeholder="Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs text-muted-foreground">
                                Updated from the latest data
                            </div>
                            <div className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs text-muted-foreground">
                                {channels.length} connected accounts
                            </div>
                        </div>
                        {state.error ? (
                            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                                {state.error}
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <GlassCard variant="morphism" className="border border-border/60 bg-background/20 p-5">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Total engagement</span>
                                <TrendingUp className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-3xl font-bold">{formatCount(totalEngagement)}</div>
                            <p className="mt-2 text-xs text-muted-foreground">Likes, comments, and shares in the selected window</p>
                        </GlassCard>
                        <GlassCard variant="morphism" className="border border-border/60 bg-background/20 p-5">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Connected platforms</span>
                                <Share2 className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-3xl font-bold">{formatCount(uniquePlatforms)}</div>
                            <p className="mt-2 text-xs text-muted-foreground">Facebook, LinkedIn, X, Instagram, and more</p>
                        </GlassCard>
                        <GlassCard variant="morphism" className="border border-border/60 bg-background/20 p-5">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Inbox attention</span>
                                <MessageSquare className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-3xl font-bold">{formatCount(attentionItems.length)}</div>
                            <p className="mt-2 text-xs text-muted-foreground">New messages and follow-ups to handle</p>
                        </GlassCard>
                        <GlassCard variant="morphism" className="border border-border/60 bg-background/20 p-5">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Reauth needed</span>
                                <RefreshCcw className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-3xl font-bold">{formatCount(reauthNeeded)}</div>
                            <p className="mt-2 text-xs text-muted-foreground">Channels that need a fresh token or reconnect</p>
                        </GlassCard>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <GlassCard variant="morphism" className="border border-border/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Published posts</span>
                        <CheckCircle2 className="size-4 text-emerald-400" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{formatCount(publishedPosts.length)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Posts already shipped live</p>
                </GlassCard>
                <GlassCard variant="morphism" className="border border-border/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Queue size</span>
                        <Clock3 className="size-4 text-amber-400" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{formatCount(scheduledPosts.length + draftPosts.length)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Drafts and scheduled posts waiting in line</p>
                </GlassCard>
                <GlassCard variant="morphism" className="border border-border/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Total views</span>
                        <Users className="size-4 text-sky-400" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{formatCount(totalViews)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Exposure across all published content</p>
                </GlassCard>
                <GlassCard variant="morphism" className="border border-border/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Trend delta</span>
                        <BarChart3 className="size-4 text-primary" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">
                        {trendDelta > 0 ? '+' : ''}
                        {formatCount(trendDelta)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {trendDelta >= 0 ? 'Growth' : 'Decline'} from the first to last point in the selected range
                    </p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold">Engagement and reaction mix</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Stack likes, comments, and shares on top of one another to see the daily pattern without leaving the page.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                            {peakPoint ? (
                                <>
                                    Peak day: <span className="font-semibold text-foreground">{peakPoint.name}</span>
                                </>
                            ) : (
                                'No chart data yet'
                            )}
                        </div>
                    </div>

                    <div className="mt-6 h-[360px] min-h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 16, right: 16, left: -12, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="areaComments" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="areaShares" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34D399" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--popover)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#E2E8F0' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="likes" stackId="1" stroke="#60A5FA" fill="url(#areaLikes)" strokeWidth={2.5} />
                                    <Area type="monotone" dataKey="comments" stackId="1" stroke="#A78BFA" fill="url(#areaComments)" strokeWidth={2.5} />
                                    <Area type="monotone" dataKey="shares" stackId="1" stroke="#34D399" fill="url(#areaShares)" strokeWidth={2.5} />
                                    <Line
                                        type="monotone"
                                        dataKey="engagement"
                                        stroke="#F8FAFC"
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/70 text-sm text-muted-foreground">
                                Schedule or connect content to populate the chart.
                            </div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div>
                        <h2 className="text-2xl font-semibold">Post status distribution</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            A compact snapshot of what is live, queued, drafted, or broken.
                        </p>
                    </div>

                    <div className="mt-6 h-[260px]">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={92}
                                        paddingAngle={3}
                                    >
                                        {statusData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--popover)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#E2E8F0' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/70 text-sm text-muted-foreground">
                                No posts yet. Status distribution will appear here.
                            </div>
                        )}
                    </div>

                    <div className="mt-4 space-y-3">
                        {statusData.length > 0 ? (
                            statusData.map((item) => (
                                <div key={item.name} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-sm text-muted-foreground">{formatCount(item.value)}</span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${statusTotal > 0 ? Math.max((item.value / statusTotal) * 100, 6) : 0}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                                Status details will populate once posts exist.
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div>
                            <h2 className="text-2xl font-semibold">Connected account health</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Real channel counts and account state are shown here instead of action shortcuts.
                        </p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {channels.length > 0 ? (
                            channels.map((channel) => {
                                const meta = platformMeta[channel.platform] ?? {
                                    icon: Share2,
                                    color: '#94A3B8',
                                    label: channel.platform,
                                };

                                return (
                                    <div key={channel.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex size-10 items-center justify-center rounded-2xl"
                                                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                                                >
                                                    <meta.icon className="size-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{meta.label}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {channel.name ?? channel.username ?? channel.platformId}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">{channel.needsReauth ? 'Needs reconnect' : 'Healthy'}</div>
                                                <div className="text-xs text-muted-foreground">Added {shortDateFormatter.format(new Date(channel.createdAt))}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
                                Connect at least one channel to unlock the channel health view.
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Accounts</div>
                            <div className="mt-2 text-2xl font-semibold">{formatCount(channels.length)}</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Reauth</div>
                            <div className="mt-2 text-2xl font-semibold">{formatCount(reauthNeeded)}</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold">Latest posts and performance</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                This list comes from the live posts endpoint and keeps the overview grounded in actual content.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                            {publishedPosts.length} published in range
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {topRecentPosts.length > 0 ? (
                            topRecentPosts.map((post) => {
                                const platformLabel = platformMeta[post.platform ?? 'post']?.label ?? post.platform ?? 'post';

                                return (
                                    <div key={post.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className="rounded-full border px-3 py-1 text-xs font-medium"
                                                        style={getStatusBadgeStyle('published')}
                                                    >
                                                        Published
                                                    </span>
                                                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                                                        {platformLabel}
                                                    </span>
                                                </div>
                                                <p className="max-w-2xl text-sm leading-6 text-foreground/90">
                                                    {getPostSnippet(post.content)}
                                                </p>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                <div>{formatDate(post.publishedAt)}</div>
                                                <div className="mt-1">
                                                    {formatCount(post.likes)} likes | {formatCount(post.comments)} comments | {formatCount(post.shares)} shares
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
                                No posts returned yet. Once content is published, the latest items will appear here.
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold">Posts per platform</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                The distribution below is derived from the analytics endpoint and reflects real publishing mix.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {platformBreakdown.length > 0 ? (
                            platformBreakdown.map((item) => {
                                const percentage = analytics?.totals.totalPosts
                                    ? Math.max((item.posts / analytics.totals.totalPosts) * 100, 2)
                                    : 0;

                                return (
                                    <div key={item.platform} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <item.icon className="size-4" style={{ color: item.color }} />
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{formatCount(item.posts)}</div>
                                                <div className="text-xs text-muted-foreground">{item.share}% of posts</div>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span>{formatCount(item.likes)} likes</span>
                                            <span>{formatCount(item.comments)} comments</span>
                                            <span>{formatCount(item.shares)} shares</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
                                Platform breakdown appears after at least one published post exists.
                            </div>
                        )}
                    </div>
                </GlassCard>

                <GlassCard variant="morphism" className="border border-border/60 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold">Operational snapshot</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                This card keeps the whole overview grounded in live volume, not navigation shortcuts.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Total engagement</div>
                            <div className="mt-2 text-2xl font-semibold">{formatCount(totalEngagement)}</div>
                            <div className="mt-2 text-sm text-muted-foreground">Likes, comments, and shares combined</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Window</div>
                            <div className="mt-2 text-2xl font-semibold">{daysRange}d</div>
                            <div className="mt-2 text-sm text-muted-foreground">Live analytics range selected above</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Views</div>
                            <div className="mt-2 text-2xl font-semibold">{formatCount(totalViews)}</div>
                            <div className="mt-2 text-sm text-muted-foreground">Observed from published content</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="text-sm font-medium text-muted-foreground">Peak day</div>
                            <div className="mt-2 text-2xl font-semibold">{peakPoint ? peakPoint.name : 'N/A'}</div>
                            <div className="mt-2 text-sm text-muted-foreground">Highest engagement point in the selected window</div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
