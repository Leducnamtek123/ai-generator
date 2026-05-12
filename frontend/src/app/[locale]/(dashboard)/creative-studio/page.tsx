'use client';

import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import React, { useEffect, useReducer } from 'react';
import {
    Plus,
    Search,
    User,
    Users,
    LayoutGrid,
    MoreHorizontal,
    Copy,
    Edit,
    Trash2,
    Image as ImageIcon,
    Loader2,
} from 'lucide-react';
import { post } from '@/lib/api';
import { Button } from '@/ui/button';
import { cn, getAssetUrl } from '@/lib/utils';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useWorkflowStore, Workflow } from '@/stores/workflow-store';
import { WorkflowCard } from '@/components/workflow/WorkflowCard';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const tabs = [
    { id: 'my', label: 'My studios', icon: User },
    { id: 'shared', label: 'Shared', icon: Users },
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
] as const;

type StudioState = {
    activeTab: (typeof tabs)[number]['id'];
    showCreateModal: boolean;
    workflowName: string;
    showRenameModal: boolean;
    editingWorkflow: Workflow | null;
    newName: string;
    uploadingWorkflowId: string | null;
};

type StudioAction =
    | { type: 'setActiveTab'; activeTab: StudioState['activeTab'] }
    | { type: 'setShowCreateModal'; showCreateModal: boolean }
    | { type: 'setWorkflowName'; workflowName: string }
    | { type: 'setShowRenameModal'; showRenameModal: boolean }
    | { type: 'setEditingWorkflow'; editingWorkflow: Workflow | null }
    | { type: 'setNewName'; newName: string }
    | { type: 'setUploadingWorkflowId'; uploadingWorkflowId: string | null }
    | { type: 'resetCreateModal' }
    | { type: 'resetRenameModal' };

type StudioDraft = {
    version: number;
    savedAt: string;
    workflowName: string;
};

const STUDIO_DRAFT_KEY = 'creative-studio:create-modal:draft';

const initialState: StudioState = {
    activeTab: 'my',
    showCreateModal: false,
    workflowName: '',
    showRenameModal: false,
    editingWorkflow: null,
    newName: '',
    uploadingWorkflowId: null,
};

function reducer(state: StudioState, action: StudioAction): StudioState {
    switch (action.type) {
        case 'setActiveTab':
            return { ...state, activeTab: action.activeTab };
        case 'setShowCreateModal':
            return { ...state, showCreateModal: action.showCreateModal };
        case 'setWorkflowName':
            return { ...state, workflowName: action.workflowName };
        case 'setShowRenameModal':
            return { ...state, showRenameModal: action.showRenameModal };
        case 'setEditingWorkflow':
            return { ...state, editingWorkflow: action.editingWorkflow };
        case 'setNewName':
            return { ...state, newName: action.newName };
        case 'setUploadingWorkflowId':
            return { ...state, uploadingWorkflowId: action.uploadingWorkflowId };
        case 'resetCreateModal':
            return { ...state, showCreateModal: false, workflowName: '' };
        case 'resetRenameModal':
            return { ...state, showRenameModal: false, editingWorkflow: null, newName: '' };
        default:
            return state;
    }
}

export default function CreativeStudioPage() {
    const { push } = useRouter();
    const { workflows, fetchWorkflows, createWorkflow, duplicateWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowStore();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [workflowToDelete, setWorkflowToDelete] = React.useState<Workflow | null>(null);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STUDIO_DRAFT_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as Partial<StudioDraft>;
            if (typeof parsed.workflowName === 'string') {
                dispatch({ type: 'setWorkflowName', workflowName: parsed.workflowName });
            }
        } catch (error) {
            console.error('Failed to restore creative studio draft', error);
        }
    }, []);

    useEffect(() => {
        if (!state.showCreateModal) {
            return;
        }

        const draft: StudioDraft = {
            version: 1,
            savedAt: new Date().toISOString(),
            workflowName: state.workflowName,
        };
        window.localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(draft));
    }, [state.workflowName]);

    const handleCreateWorkflow = async () => {
        if (!state.workflowName.trim()) return;
        const newId = await createWorkflow({ name: state.workflowName });
        if (newId) {
            window.localStorage.removeItem(STUDIO_DRAFT_KEY);
            dispatch({ type: 'resetCreateModal' });
            push(`/creator/workflow-editor?workflowId=${newId}`);
        }
    };

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await duplicateWorkflow(id);
    };

    const handleRenameInit = (e: React.MouseEvent, workflow: Workflow) => {
        e.stopPropagation();
        dispatch({ type: 'setEditingWorkflow', editingWorkflow: workflow });
        dispatch({ type: 'setNewName', newName: workflow.name });
        dispatch({ type: 'setShowRenameModal', showRenameModal: true });
    };

    const handleRenameConfirm = async () => {
        if (state.editingWorkflow && state.newName.trim()) {
            await updateWorkflow(state.editingWorkflow.id, { name: state.newName });
            dispatch({ type: 'resetRenameModal' });
        }
    };

    const handleDelete = async () => {
        if (!workflowToDelete) return;
        await deleteWorkflow(workflowToDelete.id);
        setWorkflowToDelete(null);
    };

    const handleUploadInit = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'setUploadingWorkflowId', uploadingWorkflowId: id });
        document.getElementById('thumbnail-upload')?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !state.uploadingWorkflowId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await post<{ file: { path: string } }>('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response?.file?.path) {
                await updateWorkflow(state.uploadingWorkflowId, { previewUrl: response.file.path });
            }
        } catch (error) {
            console.error('Failed to upload thumbnail', error);
        }

        e.target.value = '';
        dispatch({ type: 'setUploadingWorkflowId', uploadingWorkflowId: null });
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-8 text-foreground">
            <div className="relative flex min-h-[180px] w-full items-center justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-500/10 via-background to-cyan-500/10 p-8">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 size-80 rounded-full bg-blue-600/20 blur-[80px]" />
                    <div className="absolute -bottom-20 right-20 size-60 rounded-full bg-cyan-600/20 blur-[60px]" />
                </div>

                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
                            <LayoutGrid className="size-5 text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-blue-400">Creative studio</span>
                    </div>
                    <h1 className="mb-2 text-3xl font-semibold text-foreground">Start from scratch</h1>
                    <p className="max-w-md text-sm text-muted-foreground">Create a new studio and start collaborating.</p>
                    <Button
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: true })}
                        className="mt-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 rounded-full px-6"
                    >
                        <Plus className="size-4 mr-2" />
                        New studio
                    </Button>
                </div>

                <div className="relative z-10 hidden lg:flex flex-col gap-2.5">
                    {[
                        'Studio templates',
                        'Shared workspaces',
                        'Fast creation flow',
                        'Blue-first visual system',
                    ].map((label) => (
                        <div key={label} className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                            <LayoutGrid className="size-4 text-blue-400" />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex w-fit items-center rounded-full border border-border bg-muted/30 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: tab.id })}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                                state.activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search spaces?" className="h-10 rounded-full border-border bg-background pl-10 text-sm text-foreground placeholder:text-muted-foreground" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {state.activeTab === 'my' && (
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                dispatch({ type: 'setShowCreateModal', showCreateModal: true });
                            }
                        }}
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: true })}
                        className="group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent transition-colors hover:bg-accent/30"
                    >
                        <div className="size-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                            <Plus className="size-5 text-blue-400 transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">Create new studio</span>
                    </div>
                )}

                {workflows.map((workflow) => (
                    <WorkflowCard
                        key={workflow.id}
                        workflow={workflow}
                        href={`/creator/workflow-editor?workflowId=${workflow.id}`}
                        isUploading={state.uploadingWorkflowId === workflow.id}
                        actions={
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 bg-background/60 backdrop-blur rounded-lg text-foreground hover:bg-background/80">
                                        <MoreHorizontal className="size-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={(e) => handleRenameInit(e, workflow)} className="cursor-pointer">
                                        <Edit className="size-4 mr-2" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleDuplicate(e, workflow.id)} className="cursor-pointer">
                                        <Copy className="size-4 mr-2" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleUploadInit(e, workflow.id)} className="cursor-pointer">
                                        <ImageIcon className="size-4 mr-2" /> Upload image
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setWorkflowToDelete(workflow); }} className="text-destructive cursor-pointer">
                                        <Trash2 className="size-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        }
                    />
                ))}
            </div>

            {state.showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close create studio modal"
                        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: false })}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-semibold mb-4">Create New Studio</h2>
                        <div className="mb-6">
                            <label htmlFor="studioName" className="block text-xs font-medium text-muted-foreground mb-2">
                                Studio Name
                            </label>
                            <Input
                                id="studioName"
                                type="text"
                                value={state.workflowName}
                                onChange={(e) => dispatch({ type: 'setWorkflowName', workflowName: e.target.value })}
                                placeholder="Untitled Studio"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: false })}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateWorkflow} disabled={!state.workflowName.trim()}>
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={state.showRenameModal} onOpenChange={(open) => dispatch({ type: 'setShowRenameModal', showRenameModal: open })}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Studio</DialogTitle>
                        <DialogDescription>Enter a new name for your studio.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Input id="name" value={state.newName} onChange={(e) => dispatch({ type: 'setNewName', newName: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => dispatch({ type: 'resetRenameModal' })}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenameConfirm}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!workflowToDelete}
                onOpenChange={(open) => {
                    if (!open) setWorkflowToDelete(null);
                }}
                title="Delete studio?"
                description={
                    workflowToDelete
                        ? `Delete "${workflowToDelete.name}" permanently? This action cannot be undone.`
                        : 'Delete this studio permanently? This action cannot be undone.'
                }
                confirmText="Delete"
                onConfirm={handleDelete}
            />

            <input type="file" id="thumbnail-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
    );
}
