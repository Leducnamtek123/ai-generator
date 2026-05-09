'use client';

import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useState, useEffect, use } from 'react';
import {
    ArrowLeft,
    Image as ImageIcon,
    MoreHorizontal,
    MonitorPlay
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useWorkflowStore, Workflow } from '@/stores/workflow-store';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { useProjectStore } from '@/stores/project-store';
import { CreateWorkflowDialog } from '@/components/projects/create-workflow-dialog';

export default function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const { workflows, fetchWorkflowsByProject, createWorkflow, isLoading } = useWorkflowStore();
    const { currentProject, fetchProject } = useProjectStore();
    const [activeTab, setActiveTab] = useState('studios');

    useEffect(() => {
        fetchProject(projectId);
        fetchWorkflowsByProject(projectId);
    }, [projectId, fetchProject, fetchWorkflowsByProject]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold">
                                {currentProject?.name || 'Loading details...'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {currentProject?.description || 'Project Workspace'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <CreateWorkflowDialog projectId={projectId} onCreate={async (name) => {
                            const newId = await createWorkflow({ name, projectId });
                            if (newId) {
                                router.push(`/creator/workflow-editor?workflowId=${newId}&projectId=${projectId}`);
                            }
                        }} isLoading={isLoading} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('studios')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'studios'
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        Workflows
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'assets'
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        Assets (Media)
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'settings'
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground/70"
                        )}
                    >
                        <MoreHorizontal className="size-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {activeTab === 'studios' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {workflows.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                                <MonitorPlay className="size-12 mx-auto mb-4 opacity-20" />
                                <p>No workflows in this project yet.</p>
                                <CreateWorkflowDialog projectId={projectId} onCreate={async (name) => {
                                    const newId = await createWorkflow({ name, projectId });
                                    if (newId) {
                                        router.push(`/creator/workflow-editor?workflowId=${newId}&projectId=${projectId}`);
                                    }
                                }} isLoading={isLoading}>
                                    <Button
                                        variant="link"
                                        className="mt-2"
                                    >
                                        Create your first workflow
                                    </Button>
                                </CreateWorkflowDialog>
                            </div>
                        ) : (
                            workflows.map((workflow) => (
                                <WorkflowCard key={workflow.id} workflow={workflow} href={`/creator/workflow-editor?workflowId=${workflow.id}&projectId=${projectId}`} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="text-center py-20 text-muted-foreground">
                        <ImageIcon className="size-12 mx-auto mb-4 opacity-20" />
                        <p>Asset management coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
