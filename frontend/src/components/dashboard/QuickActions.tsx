'use client';

import * as React from 'react';
import { GlassCard } from '@/ui/glass-card';
import { Camera, Video, Layers, Wand2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function QuickActions() {
    const actions = [
        { title: 'Create Image', icon: Camera, color: 'text-chart-1', href: '/creator/image-generator' },
        { title: 'New Video', icon: Video, color: 'text-chart-2', href: '/creator/video-generator' },
        { title: 'Workflow Canvas', icon: Layers, color: 'text-chart-4', href: '/creator/workflow-editor' },
        { title: 'Magic Upscale', icon: Wand2, color: 'text-chart-5', href: '/creator/image-upscaler' },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Link key={action.title} href={action.href as any} className="block group">
                    <GlassCard
                        variant="default"
                        className="group flex h-full cursor-pointer items-center gap-4 border-border bg-card py-4 transition-all hover:bg-accent hover:border-primary/30 hover:shadow-lg"
                    >
                        <div className={`rounded-lg bg-muted p-3 ${action.color} transition-transform group-hover:scale-110`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{action.title}</span>
                            <span className="text-[10px] text-muted-foreground">Quick Start</span>
                        </div>
                    </GlassCard>
                </Link>
            ))}
        </div>
    );
}
