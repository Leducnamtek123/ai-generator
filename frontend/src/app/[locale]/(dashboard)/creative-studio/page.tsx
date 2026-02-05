'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    User,
    Users,
    LayoutGrid,
    MoreHorizontal,
    MonitorPlay,
    Copy,
    Edit,
    Trash2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
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


    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white p-6">
            {/* Hero / Start from Scratch Banner */}
            <div className="relative w-full h-48 bg-[#151619] rounded-3xl border border-white/5 overflow-hidden mb-8 flex items-center shadow-2xl">
                {/* Left Content */}
                <div className="relative z-10 p-10 flex flex-col justify-center h-full max-w-xl">
                    <h1 className="text-2xl font-bold text-white mb-2">Start from scratch</h1>
                    <p className="text-white/50 mb-6 text-sm">Create a new studio and start collaborating</p>
                    <Button
                        onClick={handleCreateNew}
                        className="bg-white text-black hover:bg-white/90 rounded-full px-6 py-2 w-fit font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New studio
                    </Button>
                </div>

                {/* Right Visual / Gradient */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-900/40 via-cyan-900/20 to-transparent">
                    <div className="absolute right-0 top-0 h-full w-full opacity-50 mix-blend-screen">
                        <div className="absolute right-[-10%] top-[-50%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px]" />
                        <div className="absolute right-[20%] bottom-[-20%] w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[80px]" />
                    </div>
                    <div className="absolute right-12 top-1/2 -translate-y-1/2 text-right">
                        <h2 className="text-5xl font-bold text-white tracking-tighter opacity-90 drop-shadow-lg">
                            Creative Studio
                        </h2>
                        <p className="text-white/60 text-sm tracking-widest uppercase mt-1">Infinite creativity</p>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Tabs */}
                <div className="flex items-center bg-[#151619] p-1 rounded-full border border-white/5 w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-white text-black shadow-sm"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                        placeholder="Search spaces..."
                        className="bg-[#151619] border-white/10 rounded-full pl-10 h-10 text-sm placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-white/20"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* New Studio Card (Ghost) */}
                {activeTab === 'my' && (
                    <div
                        onClick={handleCreateNew}
                        className="aspect-[4/3] rounded-xl border border-dashed border-white/10 bg-transparent hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-3 group transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <Plus className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-white/40 group-hover:text-white transition-colors">Create new studio</span>
                    </div>
                )}

                {workflows.map((workflow) => (
                    <div key={workflow.id} className="group cursor-pointer">
                        {/* Card Image */}
                        <div
                            onClick={() => router.push(`/creator/workflow-editor?workflowId=${workflow.id}`)}
                            className="aspect-[4/3] bg-[#151619] rounded-xl overflow-hidden border border-white/5 group-hover:border-white/20 transition-all relative mb-3"
                        >
                            {/* Preview Logic */}
                            {workflow.previewUrl ? (
                                <img
                                    src={workflow.previewUrl}
                                    alt={workflow.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (workflow.nodes && workflow.nodes.length > 0) ? (
                                /* Workflow has content - Show real graph preview */
                                <div className="w-full h-full bg-[#1A1B1F] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-dotted-spacing-4 bg-dotted-[#333] opacity-20" />
                                    <WorkflowMiniPreview nodes={workflow.nodes} edges={workflow.edges} />
                                    {/* Glass Overlay to make it look "locked" */}
                                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-none" />
                                </div>
                            ) : (
                                /* Empty Workflow - Show Cover Image */
                                <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
                                        alt="Empty Studio"
                                        className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-white/20 transition-colors">
                                            <Plus className="w-5 h-5 text-white/50 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overlay Menu */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-black/80">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-[#1A1B1F] border-white/10 text-white">
                                        <DropdownMenuItem onClick={(e) => handleRenameInit(e, workflow)} className="hover:bg-white/5 cursor-pointer">
                                            <Edit className="w-4 h-4 mr-2" /> Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleDuplicate(e, workflow.id)} className="hover:bg-white/5 cursor-pointer">
                                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        <DropdownMenuItem onClick={(e) => handleDelete(e, workflow.id)} className="hover:bg-red-500/10 text-red-400 cursor-pointer">
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Card Info */}
                        <div>
                            <h3 className="text-sm font-medium text-white/90 group-hover:text-white truncate">{workflow.name}</h3>
                            <p className="text-xs text-white/40 mt-1">
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
                    <div className="relative w-full max-w-md bg-[#151619] rounded-2xl border border-white/10 p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Studio</h2>
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Studio Name</label>
                            <input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="Untitled Studio"
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

            {/* Rename Modal */}
            <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
                <DialogContent className="bg-[#1A1B1F] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename Studio</DialogTitle>
                        <DialogDescription className="text-white/50">
                            Enter a new name for your studio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-[#0B0C0E] border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</Button>
                        <Button onClick={handleRenameConfirm}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
