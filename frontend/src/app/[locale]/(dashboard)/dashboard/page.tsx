'use client';

import { Search, Image as ImageIcon, Video, Sparkles, LayoutGrid, Wand2, Music, Box } from 'lucide-react';
import { Button } from '@/ui/button';
import { ToolCard } from '@/components/dashboard/ToolCard';
import { TemplateGallery } from '@/components/gallery/TemplateGallery';
import { TemplateExplorerModal } from '@/components/gallery/TemplateExplorerModal';
import * as React from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { Skeleton } from '@/ui/skeleton';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';
import { useOrganizations } from '@/hooks/queries/useOrganizations';

export default function DashboardPage() {
    const router = useRouter();
    
    // Modern Server State Management
    const { data: stats, isPending: isStatsLoading } = useDashboardStats();
    const { data: organizations, isPending: isOrgsLoading } = useOrganizations();

    const isLoading = isStatsLoading || isOrgsLoading;

    return (
        <div className="min-h-screen bg-background text-foreground pt-20">
            {/* Hero / Search Section */}
            <section className="pt-8 pb-12 px-8 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold animate-in fade-in duration-500">
                        What would you like to create today?
                    </h1>
                    <div className="flex items-center gap-4">
                        {stats && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pricing/10 border border-pricing/20">
                                <Sparkles className="w-3.5 h-3.5 text-pricing" />
                                <span className="text-xs font-semibold text-pricing">{stats.creditBalance} credits</span>
                            </div>
                        )}
                        <Button variant="ghost" size="sm">All tools</Button>
                    </div>
                </div>

                {/* Main Tools Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12 animate-in fade-in duration-700">
                    <ToolCard icon={Search} label="Find assets" href="/stock" />
                    <ToolCard icon={LayoutGrid} label="Spaces" href="/creator/workflow-editor" isNew color="text-chart-1" />
                    <ToolCard icon={ImageIcon} label="Image Gen" href="/creator/image-generator" color="text-chart-2" />
                    <ToolCard icon={Video} label="Video Gen" href="/creator/video-generator" color="text-chart-3" />
                    <ToolCard icon={Wand2} label="Editor" href="/creator/image-editor" />
                    <ToolCard icon={Sparkles} label="Upscaler" href="/creator/image-upscaler" color="text-chart-4" />
                    <ToolCard icon={Box} label="3D Models" href="/stock" />
                    <ToolCard icon={Music} label="Audio" href="/creator/music-generator" />
                </div>

                {/* Recent Creations */}
                <div className="mb-16 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold">Recent creations</h2>
                        <Link href="/creator" className="text-[10px] text-muted-foreground hover:text-foreground">View all &gt;</Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {isLoading ? (
                            [1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="min-w-[200px] h-[140px] rounded-xl" />
                            ))
                        ) : stats?.recentWorkflows.length === 0 ? (
                            <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-card/30">
                                <LayoutGrid className="w-8 h-8 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-xs text-muted-foreground">No recent creations yet</p>
                                <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => router.push('/creator/workflow-editor')}>
                                    Start your first space
                                </Button>
                            </div>
                        ) : (
                            stats?.recentWorkflows.map((workflow) => (
                                <Link 
                                    key={workflow.id} 
                                    href={`/creator/workflow-editor?workflowId=${workflow.id}`}
                                    className="min-w-[200px] h-[140px] bg-card rounded-xl border border-border flex flex-col justify-end p-4 relative group cursor-pointer hover:border-border/80 transition-colors overflow-hidden"
                                >
                                    {workflow.previewUrl ? (
                                        <img src={workflow.previewUrl} alt={workflow.name} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                                            <LayoutGrid className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="relative z-10">
                                        <div className="text-xs font-medium text-white">{workflow.name}</div>
                                        <div className="text-[10px] text-white/60">{new Date(workflow.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Inspiration Gallery */}
                <div className="animate-in fade-in duration-1000">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold">Get Inspired</h2>
                            <div className="flex gap-2">
                                {['Templates', 'Community', 'Tutorials'].map(tag => (
                                    <button key={tag} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <TemplateGallery hidePagination />

                    <div className="flex justify-center pt-8">
                        <TemplateExplorerModal>
                            <Button variant="outline" className="min-w-[200px]">
                                Explore all templates
                            </Button>
                        </TemplateExplorerModal>
                    </div>
                </div>
            </section>
        </div>
    );
}
