'use client';

import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useState, useEffect, useReducer } from 'react';
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
import { ConfirmDialog } from '@/components/common/confirm-dialog';
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

type WorkflowsState = {
    activeTab: string;
    showCreateModal: boolean;
    workflowName: string;
    searchTerm: string;
    workflowToDelete: WorkflowType | null;
};

type WorkflowsAction =
    | { type: 'setActiveTab'; activeTab: string }
    | { type: 'setShowCreateModal'; showCreateModal: boolean }
    | { type: 'setWorkflowName'; workflowName: string }
    | { type: 'setSearchTerm'; searchTerm: string }
    | { type: 'setWorkflowToDelete'; workflowToDelete: WorkflowType | null }
    | { type: 'resetCreateDraft' };

const initialWorkflowsState: WorkflowsState = {
    activeTab: 'my',
    showCreateModal: false,
    workflowName: '',
    searchTerm: '',
    workflowToDelete: null,
};

function workflowsReducer(state: WorkflowsState, action: WorkflowsAction): WorkflowsState {
    switch (action.type) {
        case 'setActiveTab':
            return { ...state, activeTab: action.activeTab };
        case 'setShowCreateModal':
            return { ...state, showCreateModal: action.showCreateModal };
        case 'setWorkflowName':
            return { ...state, workflowName: action.workflowName };
        case 'setSearchTerm':
            return { ...state, searchTerm: action.searchTerm };
        case 'setWorkflowToDelete':
            return { ...state, workflowToDelete: action.workflowToDelete };
        case 'resetCreateDraft':
            return { ...state, showCreateModal: false, workflowName: '' };
        default:
            return state;
    }
}

function ClientDateText({ value }: { value: string | Date }) {
    const [text, setText] = useState<string | null>(null);

    useEffect(() => {
        const date = value instanceof Date ? value : new Date(value);
        setText(Number.isNaN(date.getTime()) ? null : date.toLocaleDateString());
    }, [value]);

    return <span suppressHydrationWarning>{text ?? ''}</span>;
}

export default function WorkflowsPage() {
    const { push } = useRouter();
    const {
        workflows,
        fetchWorkflows,
        fetchCommunityWorkflows,
        createWorkflow,
        deleteWorkflow,
        isLoading
    } = useWorkflowStore();
    const { fetchProjects } = useProjectStore();

    const [state, dispatch] = useReducer(workflowsReducer, initialWorkflowsState);
    const WORKFLOW_DRAFT_KEY = 'workflows:create-modal:draft';

    useEffect(() => {
        // Pre-fetch projects to ensure we have a default project ID for new workflows
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        queueMicrotask(() => {
            try {
                const raw = window.localStorage.getItem(WORKFLOW_DRAFT_KEY);
                if (!raw) {
                    return;
                }

                const parsed = JSON.parse(raw) as { workflowName?: unknown };
                if (typeof parsed.workflowName === 'string') {
                    dispatch({ type: 'setWorkflowName', workflowName: parsed.workflowName });
                }
            } catch (error) {
                console.error('Failed to restore workflow draft', error);
            }
        });
    }, []);

    useEffect(() => {
        if (!state.showCreateModal) {
            return;
        }

        const draft = {
            version: 1,
            savedAt: new Date().toISOString(),
            workflowName: state.workflowName,
        };
        window.localStorage.setItem(WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
    }, [state.showCreateModal, state.workflowName]);

    useEffect(() => {
        if (state.activeTab === 'my') {
            fetchWorkflows();
        } else {
            fetchCommunityWorkflows();
        }
    }, [state.activeTab, fetchWorkflows, fetchCommunityWorkflows]);

    const handleCreateWorkflow = async () => {
        if (!state.workflowName.trim()) return;

        const newId = await createWorkflow({
            name: state.workflowName,
            // Project ID will be handled by store fallback
        });

        if (newId) {
            dispatch({ type: 'resetCreateDraft' });
            window.localStorage.removeItem(WORKFLOW_DRAFT_KEY);
            push(`/creator/workflow-editor?workflowId=${newId}`);
        }
    };

    const handleDelete = async () => {
        if (!state.workflowToDelete) return;
        await deleteWorkflow(state.workflowToDelete.id);
        dispatch({ type: 'setWorkflowToDelete', workflowToDelete: null });
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <div className="px-8 py-12 border-b border-border">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                        Workflows
                    </h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        Automate your creative process with node-based workflows
                    </p>
                    <Button
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: true })}
                        className="gap-2 rounded-full px-5"
                    >
                        <Plus className="size-4" />
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
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: tab.id })}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                state.activeTab === tab.id
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search workflows?"
                        value={state.searchTerm}
                        onChange={(e) => dispatch({ type: 'setSearchTerm', searchTerm: e.target.value })}
                        className="w-56 h-9 pl-10 pr-4"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading && workflows.length === 0 ? (
                        // Loading Skeletons
                        [
                            { id: 'workflow-skel-1' },
                            { id: 'workflow-skel-2' },
                            { id: 'workflow-skel-3' },
                            { id: 'workflow-skel-4' },
                        ].map((item) => (
                            <div key={item.id} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                        ))
                    ) : filteredWorkflows.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                            <Workflow className="size-12 mx-auto mb-4 opacity-20" />
                            <p>No workflows found.</p>
                        </div>
                    ) : (
                        filteredWorkflows.map((workflow) => (
                            <WorkflowCard
                                key={workflow.id}
                                workflow={workflow}
                                onDelete={() => dispatch({ type: 'setWorkflowToDelete', workflowToDelete: workflow })}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {state.showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close create workflow modal"
                        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: false })}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4">Create New Workflow</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="workflowName" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    Workflow Name
                                </label>
                                <Input
                                    id="workflowName"
                                    type="text"
                                    value={state.workflowName}
                                    onChange={(e) => dispatch({ type: 'setWorkflowName', workflowName: e.target.value })}
                                    placeholder="e.g. Image Upscaling Pipeline"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: false })}>Cancel</Button>
                            <Button onClick={handleCreateWorkflow} disabled={!state.workflowName.trim() || isLoading}>
                                Create Workflow
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!state.workflowToDelete}
                onOpenChange={(open) => {
                    if (!open) dispatch({ type: 'setWorkflowToDelete', workflowToDelete: null });
                }}
                title="Delete workflow?"
                description={
                    state.workflowToDelete
                        ? `Delete "${state.workflowToDelete.name}" permanently? This action cannot be undone.`
                        : 'Delete this workflow permanently? This action cannot be undone.'
                }
                confirmText="Delete"
                onConfirm={handleDelete}
            />
        </div>
    );
}

function WorkflowCard({
    workflow,
    onDelete
}: {
    workflow: WorkflowType;
    onDelete: () => void;
}) {
    const { push } = useRouter();

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    push(`/creator/workflow-editor?workflowId=${workflow.id}`);
                }
            }}
            onClick={() => push(`/creator/workflow-editor?workflowId=${workflow.id}`)}
            className="group cursor-pointer bg-card border border-border hover:border-border/80 rounded-xl overflow-hidden hover:bg-accent/50 transition-all flex flex-col"
        >
            {/* Preview Section */}
            <div className="aspect-video bg-muted/30 relative border-b border-border/50">
                {workflow.previewUrl ? (
                    <Image src={workflow.previewUrl} alt={workflow.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 25vw" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <Workflow className="size-12" />
                    </div>
                )}

                {/* Stats / Badges Overlay */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {workflow.visibility === 'public' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-950/40 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
                            <Globe className="size-3" /> Public
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
                                <MoreHorizontal className="size-4" />
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
                                onClick={onDelete}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-muted-foreground/60 border-t border-border/50">
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <ClientDateText value={workflow.updatedAt} />
                    </span>
                    <span className="flex items-center gap-1">
                        {workflow.nodes?.length || 0} nodes
                    </span>
                </div>
            </div>
        </div>
    );
}
