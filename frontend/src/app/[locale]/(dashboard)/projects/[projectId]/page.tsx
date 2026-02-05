'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useEffect, use } from 'react';
import {
    Plus,
    Search,
    User,
    Users,
    ArrowLeft,
    Film,
    Image as ImageIcon,
    LayoutGrid,
    MoreHorizontal,
    MonitorPlay
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useWorkflowStore, Workflow } from '@/stores/workflow-store';
import { useProjectStore } from '@/stores/project-store';

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
        <div className="min-h-screen bg-[#0B0C0E] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0B0C0E]/50 backdrop-blur-xl sticky top-0 z-20">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/projects')}
                            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                {currentProject?.name || 'Loading details...'}
                            </h1>
                            <p className="text-xs text-white/40">
                                {currentProject?.description || 'Project Workspace'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-black hover:bg-white/90 gap-2 rounded-full px-5"
                        >
                            <Plus className="w-4 h-4" />
                            New Workflow
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('studios')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'studios'
                                ? "border-white text-white"
                                : "border-transparent text-white/40 hover:text-white/60"
                        )}
                    >
                        Workflows
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'assets'
                                ? "border-white text-white"
                                : "border-transparent text-white/40 hover:text-white/60"
                        )}
                    >
                        Assets (Media)
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn(
                            "py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'settings'
                                ? "border-white text-white"
                                : "border-transparent text-white/40 hover:text-white/60"
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
                            <div className="col-span-full text-center py-20 text-white/40 border border-dashed border-white/10 rounded-2xl">
                                <MonitorPlay className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No workflows in this project yet.</p>
                                <Button
                                    variant="link"
                                    className="text-white mt-2"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Create your first workflow
                                </Button>
                            </div>
                        ) : (
                            workflows.map((workflow) => (
                                <StudioCard key={workflow.id} workflow={workflow} projectId={projectId} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'assets' && (
                    <div className="text-center py-20 text-white/40">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Asset management coming soon.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-md bg-[#151619] rounded-2xl border border-white/10 p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Workflow</h2>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                                Workflow Name
                            </label>
                            <input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="Untitled Workflow"
                                className="w-full h-10 px-3 bg-[#0B0C0E] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateWorkflow} disabled={!workflowName.trim()}>Create</Button>
                        </div>
                    </div>
                </div>
            )}
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
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#151619] border border-white/5 group-hover:border-white/20 transition-all relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={workflow.previewUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop'}
                    alt={workflow.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                    <span className="text-xs font-medium text-white px-2 py-1 bg-white/10 rounded-full backdrop-blur-md">
                        Open Editor
                    </span>
                </div>
            </div>
            <div className="mt-3">
                <p className="text-sm text-white/80 font-medium group-hover:text-white transition-colors">{workflow.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                    <p className="text-xs text-white/40">{new Date(workflow.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
