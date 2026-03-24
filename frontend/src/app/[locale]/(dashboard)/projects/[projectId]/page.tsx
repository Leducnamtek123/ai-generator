'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useEffect, use } from 'react';
import {
    Plus,
    ArrowLeft,
    Image as ImageIcon,
    MoreHorizontal,
    MonitorPlay
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { useWorkflowStore, Workflow } from '@/stores/workflow-store';
import { useProjectStore } from '@/stores/project-store';
import { CreateWorkflowDialog } from '@/components/projects/create-workflow-dialog';

export default function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const { workflows, fetchWorkflowsByProject, createWorkflow, isLoading } = useWorkflowStore();
    const { currentProject, fetchProject } = useProjectStore();
    const [activeTab, setActiveTab] = useState('studios');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workflowName, setWorkflowName] = useState('');

    useEffect(() => {
        fetchProject(projectId);
        fetchWorkflowsByProject(projectId);
    }, [projectId, fetchProject, fetchWorkflowsByProject]);

    const handleCreateWorkflow = async () => {
        if (!workflowName.trim()) return;

        const newId = await createWorkflow({
            name: workflowName,
            projectId: projectId
        });

        if (newId) {
            setShowCreateModal(false);
            setWorkflowName('');
            router.push(`/creator/workflow-editor?workflowId=${newId}&projectId=${projectId}`);
        }
    };

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
                            <ArrowLeft className="w-5 h-5" />
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
                        <CreateWorkflowDialog onCreate={async (name) => {
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
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {activeTab === 'studios' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {workflows.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                                <MonitorPlay className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No workflows in this project yet.</p>
                                <CreateWorkflowDialog onCreate={async (name) => {
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
                                <StudioCard key={workflow.id} workflow={workflow} projectId={projectId} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="text-center py-20 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Asset management coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StudioCard({ workflow, projectId }: { workflow: Workflow; projectId: string }) {
    const router = useRouter();
    return (
        <div
            onClick={() => router.push(`/creator/workflow-editor?workflowId=${workflow.id}&projectId=${projectId}`)}
            className="group cursor-pointer"
        >
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-card border border-border group-hover:border-border/80 transition-all relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={workflow.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop'}
                    alt={workflow.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                    <span className="text-xs font-medium text-foreground px-2 py-1 bg-background/80 rounded-full backdrop-blur-md">
                        Open Editor
                    </span>
                </div>
            </div>
            <div className="mt-3">
                <p className="text-sm font-medium group-hover:text-foreground transition-colors">{workflow.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
                    <p className="text-xs text-muted-foreground">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
