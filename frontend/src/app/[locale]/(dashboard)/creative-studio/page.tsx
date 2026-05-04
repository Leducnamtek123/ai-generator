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
import { useWorkflowStore, Workflow } from '@/stores/workflow-store';
import { WorkflowMiniPreview } from '@/components/workflow/WorkflowMiniPreview';
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
    const router = useRouter();
    const { workflows, fetchWorkflows, createWorkflow, duplicateWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowStore();
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const handleCreateWorkflow = async () => {
        if (!state.workflowName.trim()) return;
        const newId = await createWorkflow({ name: state.workflowName });
        if (newId) {
            dispatch({ type: 'resetCreateModal' });
            router.push(`/creator/workflow-editor?workflowId=${newId}`);
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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this studio? This action cannot be undone.')) {
            await deleteWorkflow(id);
        }
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
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="relative w-full h-48 bg-card rounded-3xl border border-border overflow-hidden mb-8 flex items-center">
                <div className="relative z-10 p-10 flex flex-col justify-center h-full max-w-xl">
                    <h1 className="text-2xl font-bold mb-2">Start from scratch</h1>
                    <p className="text-muted-foreground mb-6 text-sm">Create a new studio and start collaborating</p>
                    <Button onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: true })} className="rounded-full px-6 py-2 w-fit font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New studio
                    </Button>
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-12">
                    <div className="text-right">
                        <h2 className="text-4xl font-bold text-muted-foreground/30 tracking-tighter">Creative Studio</h2>
                        <p className="text-muted-foreground/50 text-sm tracking-widest uppercase mt-1">Infinite creativity</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center bg-muted p-1 rounded-full border border-border w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: tab.id })}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                                state.activeTab === tab.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search spaces..." className="rounded-full pl-10 h-10 text-sm" />
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
                        className="aspect-[4/3] rounded-xl border border-dashed border-border bg-transparent hover:bg-accent/50 cursor-pointer flex flex-col items-center justify-center gap-3 group transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Create new studio</span>
                    </div>
                )}

                {workflows.map((workflow) => (
                    <div
                        key={workflow.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                router.push(`/creator/workflow-editor?workflowId=${workflow.id}`);
                            }
                        }}
                        className="group cursor-pointer"
                    >
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(`/creator/workflow-editor?workflowId=${workflow.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    router.push(`/creator/workflow-editor?workflowId=${workflow.id}`);
                                }
                            }}
                            className="aspect-[4/3] bg-card rounded-xl overflow-hidden border border-border group-hover:border-border/80 transition-all relative mb-3"
                        >
                            {state.uploadingWorkflowId === workflow.id && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                                        <span className="text-xs text-foreground/80 font-medium">Uploading...</span>
                                    </div>
                                </div>
                            )}
                            {workflow.previewUrl ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getAssetUrl(workflow.previewUrl)}
                                        alt={workflow.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 1024px) 100vw, 20vw"
                                    />
                                </div>
                            ) : workflow.nodes && workflow.nodes.length > 0 ? (
                                <div className="w-full h-full bg-muted relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <WorkflowMiniPreview nodes={workflow.nodes} edges={workflow.edges} />
                                    <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] pointer-events-none" />
                                </div>
                            ) : (
                                <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                                    <Image
                                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
                                        alt="Empty Studio"
                                        fill
                                        className="object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                                        sizes="(max-width: 1024px) 100vw, 20vw"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-muted transition-colors">
                                            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 bg-background/60 backdrop-blur rounded-lg text-foreground hover:bg-background/80">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={(e) => handleRenameInit(e, workflow)} className="cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2" /> Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleDuplicate(e, workflow.id)} className="cursor-pointer">
                                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleUploadInit(e, workflow.id)} className="cursor-pointer">
                                            <ImageIcon className="w-4 h-4 mr-2" /> Upload image
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => handleDelete(e, workflow.id)} className="text-destructive cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium group-hover:text-foreground truncate">{workflow.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {state.showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close create studio modal"
                        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
                        onClick={() => dispatch({ type: 'setShowCreateModal', showCreateModal: false })}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Create New Studio</h2>
                        <div className="mb-6">
                            <label htmlFor="studioName" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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

            <input type="file" id="thumbnail-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
    );
}
