'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
    BarChart3, 
    CalendarDays,
    CheckCircle2,
    Clock3,
    Inbox,
    AlertTriangle,
    Users, 
    MessageSquare, 
    Share2, 
    ArrowUpRight,
    ArrowDownRight,
    Facebook,
    Twitter,
    Linkedin,
    Instagram
} from 'lucide-react';
import { m } from 'framer-motion';
import { socialHubApi, type SocialAnalytics, type SocialChannel, type SocialInteraction, type SocialPost } from '@/services/socialHubApi';

const AreaChart = dynamic(() => import('recharts').then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });

const SOCIAL_REFERENCES = [
    {
        name: 'Sprout Social',
        summary: 'Best overall workflow model for structure and governance.',
    },
    {
        name: 'Meta Business Suite',
        summary: 'Native Facebook baseline for inbox and publishing.',
    },
    {
        name: 'Hootsuite',
        summary: 'Multichannel inbox, automation, and listening reference.',
    },
    {
        name: 'Buffer',
        summary: 'Simple scheduling and community workflow reference.',
    },
    {
        name: 'Later',
        summary: 'Calendar, approvals, and content operations reference.',
    },
] as const;

const SOCIAL_PIPELINE = [
    { label: 'Source content', detail: 'Bring in assets, URLs, and reusable media.' },
    { label: 'Draft', detail: 'Shape copy with AI assistance and channel variants.' },
    { label: 'Review / approval', detail: 'Route content through workspace approval gates.' },
    { label: 'Publish', detail: 'Post now or schedule across connected pages.' },
    { label: 'Monitor / reply', detail: 'Track mentions, comments, and inbox interactions.' },
    { label: 'Analytics / optimize', detail: 'Measure performance and improve the next draft.' },
] as const;

type DashboardState = {
    stats: SocialAnalytics | null;
    channels: SocialChannel[];
    posts: SocialPost[];
    inboxItems: SocialInteraction[];
    isLoading: boolean;
};

type DashboardAction =
    | { type: 'setLoading'; isLoading: boolean }
    | {
        type: 'setData';
        stats: SocialAnalytics;
        channels: SocialChannel[];
        posts: SocialPost[];
        inboxItems: SocialInteraction[];
    };

const initialDashboardState: DashboardState = {
    stats: null,
    channels: [],
    posts: [],
    inboxItems: [],
    isLoading: true,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
    switch (action.type) {
        case 'setLoading':
            return { ...state, isLoading: action.isLoading };
        case 'setData':
            return {
                stats: action.stats,
                channels: action.channels,
                posts: action.posts,
                inboxItems: action.inboxItems,
                isLoading: false,
            };
        default:
            return state;
    }
}

export default function SocialDashboardPage() {
    const [dashboard, dispatch] = React.useReducer(dashboardReducer, initialDashboardState);
    const [daysRange, setDaysRange] = React.useState<7 | 30>(7);
    const platformMeta = {
        facebook: { icon: Facebook, color: '#1877F2', label: 'Facebook' },
        x: { icon: Twitter, color: '#000000', label: 'X (Twitter)' },
        twitter: { icon: Twitter, color: '#000000', label: 'X (Twitter)' },
        linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
        instagram: { icon: Instagram, color: '#E4405F', label: 'Instagram' },
    } as const;

    React.useEffect(() => {
        const fetchStats = async () => {
            dispatch({ type: 'setLoading', isLoading: true });
            try {
                const [analytics, channelData, postData, inboxData] = await Promise.all([
                    socialHubApi.getAnalytics(daysRange),
                    socialHubApi.getChannels(),
                    socialHubApi.getPosts(),
                    socialHubApi.getInbox(),
                ]);
                dispatch({
                    type: 'setData',
                    stats: analytics,
                    channels: channelData,
                    posts: postData,
                    inboxItems: inboxData,
                });
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                dispatch({ type: 'setLoading', isLoading: false });
            }
        };
        fetchStats();
    }, [daysRange]);

    if (dashboard.isLoading || !dashboard.stats) {
        return <div className="p-8 text-muted-foreground">Loading analytics?</div>;
    }

    const DISPLAY_STATS = [
        { label: 'Total Engagement', value: dashboard.stats.totals.likes + dashboard.stats.totals.comments + dashboard.stats.totals.shares, change: '+12.4%', type: 'up', icon: BarChart3 },
        { label: 'Total Likes', value: dashboard.stats.totals.likes, change: '+8.2%', type: 'up', icon: Users },
        { label: 'Total Comments', value: dashboard.stats.totals.comments, change: '+5.1%', type: 'up', icon: MessageSquare },
        { label: 'Total Shares', value: dashboard.stats.totals.shares, change: '-2.4%', type: 'down', icon: Share2 },
    ];
    const platformBreakdown = dashboard.stats.platformBreakdown ?? {};
    const totalPosts =
        dashboard.stats.totals.totalPosts ??
        Object.values(platformBreakdown).reduce((sum, item) => sum + (item.posts || 0), 0);
    const now = new Date();
    const connectedAccounts = dashboard.channels.length;
    const connectedFacebookPages = dashboard.channels.filter((account) => account.platform === 'facebook').length;
    const accountsNeedingReauth = dashboard.channels.filter((account) => account.needsReauth).length;
    const scheduledPosts = dashboard.posts.filter((post) => post.status === 'scheduled');
    const draftPosts = dashboard.posts.filter((post) => post.status === 'draft');
    const publishedPosts = dashboard.posts.filter((post) => post.status === 'published');
    const failedPosts = dashboard.posts.filter((post) => post.status === 'failed');
    const openInboxItems = dashboard.inboxItems.filter((item) => {
        const status = (item.status || '').toLowerCase();
        return status !== 'handled' && status !== 'done' && status !== 'closed';
    });
    const inboundNeedsAttention = openInboxItems.filter((item) => item.canReply !== false).length;
    let nextScheduledPost: (typeof scheduledPosts)[number] | null = null;
    let nextScheduledTime = Number.POSITIVE_INFINITY;
    for (const post of scheduledPosts) {
        const scheduledTime = post.scheduledAt ? new Date(post.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
        if (scheduledTime >= now.getTime() && scheduledTime < nextScheduledTime) {
            nextScheduledPost = post;
            nextScheduledTime = scheduledTime;
        }
    }
    const nextScheduledDate = nextScheduledPost?.scheduledAt ? new Date(nextScheduledPost.scheduledAt) : null;
    const nextScheduledLabel = nextScheduledDate
        ? nextScheduledDate.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : null;
    const audienceDistribution = Object.entries(platformBreakdown)
        .map(([platform, value]) => {
            const meta = platformMeta[platform as keyof typeof platformMeta];
            const share = totalPosts > 0 ? Math.round((value.posts / totalPosts) * 100) : 0;
            return {
                platform,
                label: meta?.label ?? platform,
                icon: meta?.icon ?? MessageSquare,
                color: meta?.color ?? 'var(--primary)',
                share,
            };
        })
        .sort((a, b) => b.share - a.share);
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-semibold tracking-tight">Social Dashboard</h1>
                <p className="text-muted-foreground">Monitor your performance across all connected social channels.</p>
                <div className="pt-2">
                    <Button asChild variant="outline" size="sm" className="w-fit">
                        <Link href="/social">Open Social Hub overview</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <GlassCard variant="morphism" className="border border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Operating snapshot</p>
                            <h2 className="mt-2 text-2xl font-semibold">What needs attention now</h2>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                This dashboard is organized the way a real social team works: connected accounts, publishing queue, inbox load, and the next scheduled action.
                            </p>
                        </div>
                        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {connectedFacebookPages} Facebook page{connectedFacebookPages === 1 ? '' : 's'}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Connected accounts</span>
                                <Share2 className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-2xl font-bold">{connectedAccounts}</div>
                            <p className="mt-1 text-xs text-muted-foreground">All channels in this workspace</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Scheduled posts</span>
                                <CalendarDays className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-2xl font-bold">{scheduledPosts.length}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{draftPosts.length} drafts waiting to move</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Open inbox threads</span>
                                <Inbox className="size-4 text-primary" />
                            </div>
                            <div className="mt-3 text-2xl font-bold">{openInboxItems.length}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{inboundNeedsAttention} ready to reply</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted-foreground">Needs review</span>
                                <AlertTriangle className="size-4 text-amber-400" />
                            </div>
                            <div className="mt-3 text-2xl font-bold">{accountsNeedingReauth}</div>
                            <p className="mt-1 text-xs text-muted-foreground">Reconnect before publishing</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard variant="morphism" className="border border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Next action</p>
                            <h2 className="mt-2 text-2xl font-semibold">Publishing queue</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Keep the next post, the inbox, and connected pages aligned so the team knows what to do first.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-3">
                        {nextScheduledPost ? (
                            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="size-4 text-primary" />
                                        <span className="font-semibold">Next scheduled post</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{nextScheduledLabel}</span>
                                </div>
                                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                                    {nextScheduledPost.content || 'Scheduled content'}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                                No scheduled post yet. Use Publish to queue content for review or future delivery.
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-muted-foreground">Published</span>
                                    <CheckCircle2 className="size-4 text-emerald-400" />
                                </div>
                                <div className="mt-3 text-2xl font-bold">{publishedPosts.length}</div>
                                <p className="mt-1 text-xs text-muted-foreground">Ready for analytics review</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-muted-foreground">Failed</span>
                                    <AlertTriangle className="size-4 text-rose-400" />
                                </div>
                                <div className="mt-3 text-2xl font-bold">{failedPosts.length}</div>
                                <p className="mt-1 text-xs text-muted-foreground">Check auth, media, or API errors</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GlassCard variant="morphism" className="border border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Facebook-first baseline</p>
                            <h2 className="text-2xl font-semibold mt-2">Reference products to learn from</h2>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                Facebook Page workflows are the canonical starting point. Other channels should extend the same workspace model, not replace it.
                            </p>
                        </div>
                        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Page-first
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {SOCIAL_REFERENCES.map((reference) => (
                            <div key={reference.name} className="rounded-xl border border-white/10 bg-background/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold">{reference.name}</span>
                                    <span className="text-xs text-muted-foreground">Reference</span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{reference.summary}</p>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard variant="morphism" className="border border-white/10 p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Product pipeline</p>
                            <h2 className="text-2xl font-semibold mt-2">From content source to optimization</h2>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                Social Hub is a workflow system. Publishing is one stage in a larger loop that includes review, monitoring, and analytics.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {SOCIAL_PIPELINE.map((step, index) => (
                            <m.div
                                key={step.label}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="rounded-xl border border-white/10 bg-background/40 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    <span className="font-semibold">{step.label}</span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground pl-11">{step.detail}</p>
                            </m.div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {DISPLAY_STATS.map((stat, index) => (
                    <m.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <GlassCard variant="morphism" className="border border-white/10 p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <stat.icon className="size-5" />
                                </div>
                                <div className={`flex items-center text-xs font-bold ${stat.type === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                    {stat.change}
                                    {stat.type === 'up' ? <ArrowUpRight className="size-3 ml-1" /> : <ArrowDownRight className="size-3 ml-1" />}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                <h3 className="text-2xl font-semibold mt-1 text-white">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</h3>
                            </div>
                        </GlassCard>
                    </m.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Engagement Chart */}
                <GlassCard variant="morphism" className="lg:col-span-8 h-[400px] border border-white/10 flex flex-col">
                    <div className="flex items-center justify-between p-6">
                        <h3 className="font-semibold text-lg">Engagement Overview</h3>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setDaysRange(7)}
                                className={daysRange === 7 ? "bg-primary/5 border-primary/20 text-primary" : ""}
                            >
                                7 Days
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setDaysRange(30)}
                                className={daysRange === 30 ? "bg-primary/5 border-primary/20 text-primary" : ""}
                            >
                                30 Days
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[260px] pb-6 pr-6">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                            minHeight={220}
                        >
                            <AreaChart data={dashboard.stats.chartData}>
                                <defs>
                                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="name" 
                                    stroke="rgba(255,255,255,0.2)" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="rgba(255,255,255,0.2)" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="engagement" 
                                    stroke="var(--primary)" 
                                    fillOpacity={1} 
                                    fill="url(#colorEngage)" 
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Platform Distribution */}
                <GlassCard variant="morphism" className="lg:col-span-4 h-[400px] border border-white/10">
                    <h3 className="font-semibold text-lg mb-8">Audience Distribution</h3>
                    {audienceDistribution.length > 0 ? (
                        <div className="space-y-6">
                            {audienceDistribution.map((item) => (
                                <div key={item.platform} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <item.icon className="size-4" style={{ color: item.color }} />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <span className="font-bold">{item.share}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <m.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.share}%` }}
                                            className="h-full bg-primary"
                                            style={{ backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-muted-foreground">
                            Connect and publish to social channels to see audience distribution here.
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
