'use client';

import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Workflow,
    MoreHorizontal,
    Globe,
    Clock
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type Workflow as WorkflowType } from '@/stores/workflow-store';
import { useProjectStore } from '@/stores/project-store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabs = [
    { id: 'my', label: 'My Workflows', icon: Workflow },
    { id: 'community', label: 'Community', icon: Globe },
];

export default function WorkflowsPage() {
    const router = useRouter();
    const {
        workflows,
        fetchWorkflows,
        fetchCommunityWorkflows,
        createWorkflow,
        deleteWorkflow,
        isLoading
    } = useWorkflowStore();
    const { fetchProjects } = useProjectStore();

    const [activeTab, setActiveTab] = useState('my');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Pre-fetch projects to ensure we have a default project ID for new workflows
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (activeTab === 'my') {
            fetchWorkflows();
        } else {
            fetchCommunityWorkflows();
        }
    }, [activeTab, fetchWorkflows, fetchCommunityWorkflows]);

    const handleCreateWorkflow = async () => {
        if (!workflowName.trim()) return;

        const newId = await createWorkflow({
            name: workflowName,
            // Project ID will be handled by store fallback
        });

        if (newId) {
            setShowCreateModal(false);
            setWorkflowName('');
            router.push(`/creator/workflow-editor?workflowId=${newId}`);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this workflow?')) {
            await deleteWorkflow(id);
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <div className="px-8 py-12 border-b border-border">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Workflows
                    </h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        Automate your creative process with node-based workflows
                    </p>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="gap-2 rounded-full px-5"
                    >
                        <Plus className="w-4 h-4" />
                        New Workflow
                    </Button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                activeTab === tab.id
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-56 h-9 pl-10 pr-4"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading && workflows.length === 0 ? (
                        // Loading Skeletons
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                        ))
                    ) : filteredWorkflows.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                            <Workflow className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No workflows found.</p>
                        </div>
                    ) : (
                        filteredWorkflows.map((workflow) => (
                            <WorkflowCard
                                key={workflow.id}
                                workflow={workflow}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close create workflow modal"
                        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="workflowName" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    Workflow Name
                                </label>
                                <Input
                                    id="workflowName"
                                    type="text"
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    placeholder="e.g. Image Upscaling Pipeline"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateWorkflow} disabled={!workflowName.trim() || isLoading}>
                                Create Workflow
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function WorkflowCard({
    workflow,
    onDelete
}: {
    workflow: WorkflowType;
    onDelete: (e: React.MouseEvent, id: string) => void;
}) {
    const router = useRouter();

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/creator/workflow-editor?workflowId=${workflow.id}`); }}
            onClick={() => router.push(`/creator/workflow-editor?workflowId=${workflow.id}`)}
            className="group cursor-pointer bg-card border border-border hover:border-border/80 rounded-xl overflow-hidden hover:bg-accent/50 transition-all flex flex-col"
        >
            {/* Preview Section */}
                <div className="aspect-video bg-muted/30 relative border-b border-border/50">
                {workflow.previewUrl ? (
                    <Image src={workflow.previewUrl} alt={workflow.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 25vw" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <Workflow className="w-12 h-12" />
                    </div>
                )}

                {/* Stats / Badges Overlay */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {workflow.visibility === 'public' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-gray-950/40 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Public
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold group-hover:text-foreground transition-colors truncate pr-2">
                        {workflow.name}
                    </h3>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 -mr-2 -mt-1 rounded-md hover:bg-white/5"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Duplicate logic here
                            }}>
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => onDelete(e, workflow.id)}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-muted-foreground/60 border-t border-border/50">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        {workflow.nodes?.length || 0} nodes
                    </span>
                </div>
            </div>
        </div>
    );
}
