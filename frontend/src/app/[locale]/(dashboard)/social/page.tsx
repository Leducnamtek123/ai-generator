'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, LayoutDashboard, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

const HUB_CARDS = [
    {
        href: '/social/dashboard',
        icon: LayoutDashboard,
        title: 'Dashboard',
        description: 'Track analytics, audience distribution, and performance windows.',
    },
    {
        href: '/social/channels',
        icon: Share2,
        title: 'Channels',
        description: 'Connect Facebook Pages first, then expand to other social providers.',
    },
    {
        href: '/social/publish',
        icon: Sparkles,
        title: 'Publish',
        description: 'Draft, schedule, and customize content across connected accounts.',
    },
    {
        href: '/social/inbox',
        icon: MessageSquare,
        title: 'Inbox',
        description: 'Reply to comments and messages from a unified interaction stream.',
    },
    {
        href: '/social/calendar',
        icon: CalendarDays,
        title: 'Calendar',
        description: 'Plan month, week, and day views around the publishing pipeline.',
    },
] as const;

const PIPELINE = [
    'Source content',
    'Draft',
    'Review / approval',
    'Publish',
    'Monitor / reply',
    'Analytics / optimize',
] as const;

export default function SocialHubOverviewPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <GlassCard variant="morphism" className="border border-white/10 p-8 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative flex flex-col gap-6">
                    <div className="max-w-3xl space-y-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Social Hub</p>
                        <h1 className="text-4xl font-semibold tracking-tight">Facebook-first multichannel workspace</h1>
                        <p className="text-muted-foreground text-lg leading-7">
                            Facebook Page workflows are the reference model. The rest of the workspace extends the same pipeline across publishing, inbox, calendar, analytics, and monitoring.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href="/social/channels">Start with Channels</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/social/publish">Open Publish</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/social/inbox">Open Inbox</Link>
                        </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {PIPELINE.map((step, index) => (
                            <div key={step} className="rounded-xl border border-white/10 bg-background/40 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    <span className="font-semibold">{step}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {HUB_CARDS.map((card, index) => (
                    <motion.div
                        key={card.href}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <GlassCard variant="morphism" className="border border-white/10 p-6 h-full">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <card.icon className="h-5 w-5" />
                            </div>
                            <h2 className="mt-4 text-xl font-semibold">{card.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                            <Button asChild variant="ghost" className="mt-6 w-fit px-0 text-primary hover:bg-transparent hover:text-primary/80">
                                <Link href={card.href}>
                                    Open {card.title}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
