'use client';

import { LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/ui/button';
import { ToolCard } from '@/components/dashboard/ToolCard';
import { TemplateGallery } from '@/components/gallery/TemplateGallery';
import { TemplateExplorerModal } from '@/components/gallery/TemplateExplorerModal';
import * as React from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useDashboardStats } from '@/hooks/queries/useDashboardStats';
import { useWorkspaces } from '@/hooks/queries/useWorkspaces';
import { WorkflowCard as DashboardWorkflowCard } from '@/components/workflow/WorkflowCard';
import type { Workflow as WorkflowType } from '@/stores/workflow-store';
import { CREATOR_TOOL_HIGHLIGHTS, DASHBOARD_TAGS } from '@/components/layouts/navigation-data';
import { useTranslations } from 'next-intl';
import { translateLayoutLabel } from '@/components/layouts/i18n-helpers';
import { ToolCardSkeleton, WorkflowCardSkeleton } from '@/components/common/loading-skeletons';

export default function DashboardPage() {
    const { push } = useRouter();
    const t = useTranslations('Dashboard');
    const tLayout = useTranslations('Layout');
    
    // Modern Server State Management
    const { data: stats, isPending: isStatsLoading } = useDashboardStats();
    const { isPending: isWorkspacesLoading } = useWorkspaces();
    const recentWorkflows = (stats?.recentWorkflows ?? []) as WorkflowType[];

    const isLoading = isStatsLoading || isWorkspacesLoading;

    return (
        <div className="min-h-screen bg-background text-foreground pt-20">
            {/* Hero / Search Section */}
            <section className="pt-8 pb-12 px-8 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold animate-in fade-in duration-500">
                        {t('heroTitle')}
                    </h1>
                    <div className="flex items-center gap-4">
                        {stats && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-credits/10 border border-credits/20">
                                <Sparkles className="size-3.5 text-credits" />
                                <span className="text-xs font-semibold text-credits">{stats.creditBalance} credits</span>
                            </div>
                        )}
                        <Button asChild variant="ghost" size="sm">
                        <Link href="/creator">{t('allTools')}</Link>
                        </Button>
                    </div>
                </div>

                {/* Main Tools Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12 animate-in fade-in duration-700">
                    {isLoading
                        ? CREATOR_TOOL_HIGHLIGHTS.map((tool) => (
                            <ToolCardSkeleton key={tool.label} />
                        ))
                        : CREATOR_TOOL_HIGHLIGHTS.map((tool) => (
                            <ToolCard
                                key={tool.label}
                                icon={tool.icon}
                                label={translateLayoutLabel(tLayout, tool.label)}
                                href={tool.href}
                                isNew={tool.isNew}
                                color={tool.color}
                            />
                        ))}
                </div>

                {/* Recent Creations */}
                <div className="mb-16 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold">{t('recentCreations')}</h2>
                        <Link href="/creator" className="text-xs font-medium text-muted-foreground hover:text-foreground">{t('viewAll')} &gt;</Link>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {isLoading ? (
                            [
                                { id: "recent-1" },
                                { id: "recent-2" },
                                { id: "recent-3" },
                                { id: "recent-4" },
                            ].map((item) => (
                                <WorkflowCardSkeleton key={item.id} className="w-[200px] min-w-[200px] shrink-0" />
                            ))
                        ) : recentWorkflows.length === 0 ? (
                            <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-card/30">
                                <LayoutGrid className="size-8 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-xs text-muted-foreground">{t('noRecentCreations')}</p>
                                <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => push('/creator/workflow-editor')}>
                                    {t('startFirstSpace')}
                                </Button>
                            </div>
                        ) : (
                            recentWorkflows.map((workflow) => (
                                <DashboardWorkflowCard
                                    key={workflow.id}
                                    workflow={workflow}
                                    href={`/creator/workflow-editor?workflowId=${workflow.id}`}
                                    className="w-[200px] min-w-[200px] shrink-0"
                                    variant="compact"
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Inspiration Gallery */}
                <div className="animate-in fade-in duration-1000">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold">{t('inspired')}</h2>
                            <div className="flex gap-2">
                                {DASHBOARD_TAGS.map(tag => (
                                    <button key={tag} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        {translateLayoutLabel(tLayout, tag)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <TemplateGallery hidePagination />

                    <div className="flex justify-center pt-8">
                        <TemplateExplorerModal>
                            <Button variant="outline" className="min-w-[200px]">
                            {t('exploreTemplates')}
                        </Button>
                        </TemplateExplorerModal>
                    </div>
                </div>
            </section>
        </div>
    );
}
