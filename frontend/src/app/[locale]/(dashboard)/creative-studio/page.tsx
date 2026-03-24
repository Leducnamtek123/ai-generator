'use client';

import { useRouter } from '@/i18n/navigation';
import React, { useState, useEffect } from 'react';
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
    Image,
    Loader2
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
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const tabs = [
    { id: 'my', label: 'My studios', icon: User },
    { id: 'shared', label: 'Shared', icon: Users },
    { id: 'templates', label: 'Templates', icon: LayoutGrid },
];

export default function CreativeStudioPage() {
    const router = useRouter();
    const { workflows, fetchWorkflows, createWorkflow, duplicateWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowStore();
    const [activeTab, setActiveTab] = useState('my');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [workflowName, setWorkflowName] = useState('');

    // Rename State
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [newName, setNewName] = useState('');
    const [uploadingWorkflowId, setUploadingWorkflowId] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const handleCreateNew = () => {
        setShowCreateModal(true);
    };

    const handleCreateWorkflow = async () => {
        if (!workflowName.trim()) return;
        const newId = await createWorkflow({
            name: workflowName,
        });
        if (newId) {
            setShowCreateModal(false);
            setWorkflowName('');
            router.push(`/creator/workflow-editor?workflowId=${newId}`);
        }
    };

    // Card Actions
    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await duplicateWorkflow(id);
    };

    const handleRenameInit = (e: React.MouseEvent, workflow: Workflow) => {
        e.stopPropagation();
        setEditingWorkflow(workflow);
        setNewName(workflow.name);
        setShowRenameModal(true);
    };

    const handleRenameConfirm = async () => {
        if (editingWorkflow && newName.trim()) {
            await updateWorkflow(editingWorkflow.id, { name: newName });
            setShowRenameModal(false);
            setEditingWorkflow(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this studio? This action cannot be undone.")) {
            await deleteWorkflow(id);
        }
    };

    const handleUploadInit = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setUploadingWorkflowId(id);
        document.getElementById('thumbnail-upload')?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingWorkflowId) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await post<{ file: { path: string } }>('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response?.file?.path) {
                await updateWorkflow(uploadingWorkflowId, { previewUrl: response.file.path });
            }
        } catch (error) {
            console.error('Failed to upload thumbnail', error);
        } finally {
            e.target.value = '';
            setUploadingWorkflowId(null);
        }
    };


    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            {/* Hero / Start from Scratch Banner - Simplified */}
            <div className="relative w-full h-48 bg-card rounded-3xl border border-border overflow-hidden mb-8 flex items-center">
                {/* Left Content */}
                <div className="relative z-10 p-10 flex flex-col justify-center h-full max-w-xl">
                    <h1 className="text-2xl font-bold mb-2">Start from scratch</h1>
                    <p className="text-muted-foreground mb-6 text-sm">Create a new studio and start collaborating</p>
                    <Button
                        onClick={handleCreateNew}
                        className="rounded-full px-6 py-2 w-fit font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New studio
                    </Button>
                </div>

                {/* Right Visual - Neutral, no gradient */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-12">
                    <div className="text-right">
                        <h2 className="text-4xl font-bold text-muted-foreground/30 tracking-tighter">
                            Creative Studio
                        </h2>
                        <p className="text-muted-foreground/50 text-sm tracking-widest uppercase mt-1">Infinite creativity</p>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Tabs */}
                <div className="flex items-center bg-muted p-1 rounded-full border border-border w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search spaces..."
                        className="rounded-full pl-10 h-10 text-sm"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* New Studio Card (Ghost) */}
                {activeTab === 'my' && (
                    <div
                        onClick={handleCreateNew}
                        className="aspect-[4/3] rounded-xl border border-dashed border-border bg-transparent hover:bg-accent/50 cursor-pointer flex flex-col items-center justify-center gap-3 group transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Create new studio</span>
                    </div>
                )}

                {workflows.map((workflow) => (
                    <div key={workflow.id} className="group cursor-pointer">
                        {/* Card Image */}
                        <div
                            onClick={() => router.push(`/creator/workflow-editor?workflowId=${workflow.id}`)}
                            className="aspect-[4/3] bg-card rounded-xl overflow-hidden border border-border group-hover:border-border/80 transition-all relative mb-3"
                        >
                            {/* Loading Overlay */}
                            {uploadingWorkflowId === workflow.id && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                                        <span className="text-xs text-foreground/80 font-medium">Uploading...</span>
                                    </div>
                                </div>
                            )}
                            {/* Preview Logic */}
                            {workflow.previewUrl ? (
                                <img
                                    src={getAssetUrl(workflow.previewUrl)}
                                    alt={workflow.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (workflow.nodes && workflow.nodes.length > 0) ? (
                                <div className="w-full h-full bg-muted relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <WorkflowMiniPreview nodes={workflow.nodes} edges={workflow.edges} />
                                    <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] pointer-events-none" />
                                </div>
                            ) : (
                                <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
                                        alt="Empty Studio"
                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-muted transition-colors">
                                            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overlay Menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
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
                                            <Image className="w-4 h-4 mr-2" /> Upload image
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => handleDelete(e, workflow.id)} className="text-destructive cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Card Info */}
                        <div>
                            <h3 className="text-sm font-medium group-hover:text-foreground truncate">{workflow.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Create New Studio</h2>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Studio Name</label>
                            <Input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="Untitled Studio"
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

            {/* Rename Modal */}
            <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Studio</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your studio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</Button>
                        <Button onClick={handleRenameConfirm}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden File Input for Thumbnail Upload */}
            <input
                type="file"
                id="thumbnail-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
