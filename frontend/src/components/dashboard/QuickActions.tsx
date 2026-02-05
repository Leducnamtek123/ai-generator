'use client';

import * as React from 'react';
import { GlassCard } from '@/ui/glass-card';
import { Camera, Video, Layers, Wand2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function QuickActions() {
    const actions = [
        { title: 'Create Image', icon: Camera, color: 'text-blue-400', href: '/studio' },
        { title: 'New Video', icon: Video, color: 'text-purple-400', href: '/studio' },
        { title: 'Workflow Canvas', icon: Layers, color: 'text-emerald-400', href: '/workflow' },
        { title: 'Magic Upscale', icon: Wand2, color: 'text-amber-400', href: '/studio' },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Link key={action.title} href={action.href as any} className="block group">
                    <GlassCard
                        variant="default"
                        className="group flex h-full cursor-pointer items-center gap-4 border-white/5 bg-white/5 py-4 transition-all hover:bg-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    >
                        <div className={`rounded-lg bg-white/5 p-3 ${action.color} transition-transform group-hover:scale-110`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">{action.title}</span>
                            <span className="text-[10px] text-white/40">Quick Start</span>
                        </div>
                    </GlassCard>
                </Link>
            ))}
        </div>
    );
}
