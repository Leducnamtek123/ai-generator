'use client';

import * as React from 'react';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Sparkles, Plus, Copy, Edit, Image, FolderInput, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/ui/button';
import { UserMenu } from './header/UserMenu';
import { useAuth } from '@/providers';
import { useRouter } from '@/i18n/navigation';
import { useWorkflowStore } from '@/stores/workflow-store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isWorkflow = pathname === '/workflow';
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { workflow, createWorkflow, duplicateWorkflow, updateWorkflow } = useWorkflowStore();

    // Modal States
    const [isRenameOpen, setIsRenameOpen] = React.useState(false);
    const [newName, setNewName] = React.useState('');

    // Protected Routes Check (excluding home and auth)
    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/register';

    React.useEffect(() => {
        if (!isLoading && !user && !isPublicRoute) {
            router.push('/');
        }
    }, [user, isLoading, pathname, router, isPublicRoute]);

    if (isLoading) return <div className="h-screen w-full bg-[#0B0C0E] flex items-center justify-center"><Sparkles className="w-8 h-8 animate-pulse text-blue-500" /></div>;

    if (!user && isPublicRoute) {
        return <div className="w-full bg-[#0B0C0E]">{children}</div>;
    }

    const handleCreateNew = () => {
        router.push('/creative-studio'); // Or open a modal? Let's go to studio for now or create directly?
        // User wants "New Space" option.
        // Let's create a NEW untitled space immediately
        createWorkflow({ name: 'Untitled Studio' }).then(id => {
            if (id) router.push(`/workflow?workflowId=${id}`);
        });
    };

    const handleDuplicate = async () => {
        if (workflow?.id) {
            const newId = await duplicateWorkflow(workflow.id);
            if (newId) router.push(`/workflow?workflowId=${newId}`);
        }
    };

    const handleRenameOpen = () => {
        setNewName(workflow?.name || '');
        setIsRenameOpen(true);
    };

    const confirmRename = async () => {
        if (workflow?.id && newName.trim()) {
            await updateWorkflow(workflow.id, { name: newName });
            setIsRenameOpen(false);
        }
    };

    // Breadcrumb Logic
    const getBreadcrumbs = () => {
        if (isWorkflow) {
            return (
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Personal</Link>
                    <span className="text-white/20">/</span>
                    <Link href="/creative-studio" className="text-white/40 hover:text-white transition-colors">Creative Studio</Link>
                    <span className="text-white/20">/</span>

                    {/* Workflow Name Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-md transition-colors outline-none">
                                <span className="text-white font-medium text-xs">
                                    {workflow?.name || 'Untitled Studio'}
                                </span>
                                <ChevronDown className="w-3 h-3 text-white/40" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-[#1A1B1F] border-white/10 text-white">
                            <DropdownMenuItem onClick={handleCreateNew} className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                <span>New Space</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={handleDuplicate} className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                                <Copy className="w-4 h-4 mr-2" />
                                <span>Duplicate space</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleRenameOpen} className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                                <Edit className="w-4 h-4 mr-2" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white" disabled>
                                <Image className="w-4 h-4 mr-2" />
                                <span>Change cover (Soon)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white" disabled>
                                <FolderInput className="w-4 h-4 mr-2" />
                                <span>Move to folder (Soon)</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors">Personal</Link>
                {pathname !== '/dashboard' && pathname !== '/' && (
                    <>
                        <span className="text-white/20">/</span>
                        <Link href={pathname as any} className="text-white font-medium hover:text-white transition-colors">
                            {pathname === '/creative-studio' ? 'Creative Studio' : (pathname.replace(/^\//, '').split('/')[0].charAt(0).toUpperCase() + pathname.replace(/^\//, '').split('/')[0].slice(1))}
                        </Link>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-[#0B0C0E] text-white">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 flex items-center px-6 border-b border-white/5 bg-[#0B0C0E] shrink-0 z-50">
                    <div className="flex items-center gap-4 text-xs font-medium">
                        {getBreadcrumbs()}
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="h-8 gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 px-3 rounded-lg text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            Share
                        </Button>
                        <div className="h-4 w-px bg-white/10" />
                        <UserMenu />
                    </div>
                </header>

                <div className={cn(
                    "flex-1 min-h-0 relative",
                    isWorkflow ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
                )}>
                    {children}
                </div>

                {/* Rename Dialog */}
                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogContent className="bg-[#1A1B1F] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rename Space</DialogTitle>
                            <DialogDescription className="text-white/50">
                                Enter a new name for your space.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Input
                                    id="link"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-[#0B0C0E] border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-end">
                            <Button type="button" variant="secondary" onClick={() => setIsRenameOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={confirmRename}>
                                Rename
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
