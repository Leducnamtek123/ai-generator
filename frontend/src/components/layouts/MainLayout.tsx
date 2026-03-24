'use client';

import * as React from 'react';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Share2, Sparkles, Plus, Copy, Edit, Image, FolderInput, ChevronDown, Menu, Bell } from 'lucide-react';
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function MainLayout({ children, onMenuClick }: { children: React.ReactNode, onMenuClick?: () => void }) {
    const pathname = usePathname();
    const isWorkflow = pathname === '/creator/workflow-editor';
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { workflow, createWorkflow, duplicateWorkflow, updateWorkflow } = useWorkflowStore();

    const [isRenameOpen, setIsRenameOpen] = React.useState(false);
    const [newName, setNewName] = React.useState('');

    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/register';

    React.useEffect(() => {
        if (!isLoading && !user && !isPublicRoute) {
            router.push('/');
        }
    }, [user, isLoading, pathname, router, isPublicRoute]);

    if (isLoading) return <div className="h-screen w-full bg-background flex items-center justify-center"><Sparkles className="w-8 h-8 animate-pulse text-primary" /></div>;

    if (!user && isPublicRoute) {
        return <div className="w-full bg-background">{children}</div>;
    }

    const handleCreateNew = () => {
        createWorkflow({ name: 'Untitled Studio' }).then(id => {
            if (id) router.push(`/creator/workflow-editor?workflowId=${id}`);
        });
    };

    const handleDuplicate = async () => {
        if (workflow?.id) {
            const newId = await duplicateWorkflow(workflow.id);
            if (newId) router.push(`/creator/workflow-editor?workflowId=${newId}`);
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

    const getBreadcrumbs = () => {
        // Handle specific route for Workflow Editor
        if (isWorkflow) {
            return (
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Personal</Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/creator" className="text-muted-foreground hover:text-foreground transition-colors">Creator</Link>
                    <span className="text-muted-foreground">/</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded-md transition-colors outline-none">
                                <span className="text-foreground font-medium text-xs">
                                    {workflow?.name || 'Untitled Studio'}
                                </span>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem onClick={handleCreateNew}>
                                <Plus className="w-4 h-4 mr-2" />
                                <span>New Space</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDuplicate}>
                                <Copy className="w-4 h-4 mr-2" />
                                <span>Duplicate space</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleRenameOpen}>
                                <Edit className="w-4 h-4 mr-2" />
                                <span>Rename</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        // Handle other Creator tools
        if (pathname.startsWith('/creator/')) {
            const toolName = pathname.split('/').pop()?.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'Tool';
            // Special case fixes for nice naming
            const formatName = (name: string) => {
                const map: { [key: string]: string } = {
                    'image-generator': 'Image Generator',
                    'video-generator': 'Video Generator',
                    'image-editor': 'Image Editor',
                    'image-upscaler': 'Image Upscaler',
                    'music-generator': 'Music Generator',
                    // Add others as needed
                };
                return map[name.toLowerCase().replace(/ /g, '-')] || name;
            };

            const displayName = formatName(toolName);

            return (
                <div className="flex items-center gap-2 text-xs">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Personal</Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/creator" className="text-muted-foreground hover:text-foreground transition-colors">Creator</Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{displayName}</span>
                </div>
            );
        }

        // Handle Creator root page
        if (pathname === '/creator') {
            return (
                <div className="flex items-center gap-2 text-xs">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Personal</Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">Creator</span>
                </div>
            );
        }

        // Default / Dashboard
        return (
            <div className="flex items-center gap-2">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Personal</Link>
                {pathname !== '/dashboard' && pathname !== '/' && (
                    <>
                        <span className="text-muted-foreground">/</span>
                        <Link href={pathname as any} className="text-foreground font-medium hover:text-foreground transition-colors">
                            {pathname === '/creative-studio' ? 'Creative Studio' : (pathname.replace(/^\//, '').split('/')[0].charAt(0).toUpperCase() + pathname.replace(/^\//, '').split('/')[0].slice(1))}
                        </Link>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-background text-foreground">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 flex items-center px-4 md:px-6 border-b border-border bg-background shrink-0 z-50">
                    <div className="flex items-center gap-2 md:gap-4 text-xs font-medium">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden h-8 w-8"
                            onClick={onMenuClick}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        {getBreadcrumbs()}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="hidden sm:flex h-8 gap-2">
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                        </Button>
                        <div className="hidden sm:block h-4 w-px bg-border mx-1" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0">
                                <div className="p-3 border-b border-border flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">Notifications</h3>
                                    <button className="text-xs text-muted-foreground hover:text-foreground">Mark all as read</button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    <div className="p-3 border-b border-border hover:bg-muted/50 cursor-pointer flex gap-3 opacity-60">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-tight">Image generated successfully</p>
                                            <p className="text-xs text-muted-foreground">Your 4 images for "Cyberpunk city" are ready.</p>
                                        </div>
                                    </div>
                                    <div className="p-3 border-b border-border hover:bg-muted/50 cursor-pointer flex gap-3 px-3 py-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Image className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-tight">Welcome to PaintAI</p>
                                            <p className="text-xs text-muted-foreground">Thanks for joining! You have 100 free credits to get started.</p>
                                        </div>
                                    </div>
                                    <div className="p-3 hover:bg-muted/50 cursor-pointer flex gap-3 px-3 py-3 opacity-60">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-tight">Video generation failed</p>
                                            <p className="text-xs text-muted-foreground">Error generating "Lip sync for Avatar". Credits refunded.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 border-t border-border">
                                    <Button variant="ghost" className="w-full text-xs h-8">View all notifications</Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="hidden sm:block h-4 w-px bg-border mx-1" />
                        <UserMenu />
                    </div>
                </header>

                <div className={cn(
                    "flex-1 min-h-0 relative",
                    isWorkflow ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
                )}>
                    {children}
                </div>

                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Rename Space</DialogTitle>
                            <DialogDescription>
                                Enter a new name for your space.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Input
                                    id="link"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
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
