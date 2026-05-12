'use client';

import * as React from 'react';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Share2, Sparkles, Plus, Copy, Edit, ChevronDown, Menu, Bell } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/button';
import { WORKSPACE_ROOT } from './navigation-data';
import { UserMenu } from './header/UserMenu';
import { useAuth } from '@/providers';
import { useRouter } from '@/i18n/navigation';
import { useWorkflowStore } from '@/stores/workflow-store';
import { useNotificationStore } from '@/stores/notification-store';
import { Skeleton } from '@/ui/skeleton';
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
    const { push } = useRouter();
    const t = useTranslations('Layout');
    const { workflow, createWorkflow, duplicateWorkflow, updateWorkflow } = useWorkflowStore();

    const [isRenameOpen, setIsRenameOpen] = React.useState(false);
    const [newName, setNewName] = React.useState('');

    const isPublicRoute =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/sign-in' ||
        pathname === '/sign-up';
    const isCreatorWorkspace = pathname.startsWith('/creator/') && pathname !== '/creator';

    if (isLoading) {
        return (
            <div className="flex h-full w-full bg-background text-foreground">
                <div className="hidden w-64 shrink-0 border-r border-border bg-background/80 p-4 lg:block">
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-28 rounded-full" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                            <Skeleton className="h-4 w-3/6" />
                        </div>
                    </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-14 items-center border-b border-border px-4 md:px-6">
                        <Skeleton className="h-4 w-48 rounded-full" />
                        <div className="ml-auto flex items-center gap-2">
                            <Skeleton className="hidden h-8 w-20 rounded-full sm:block" />
                            <Skeleton className="size-8 rounded-full" />
                            <Skeleton className="size-8 rounded-full" />
                        </div>
                    </div>
                    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                        <div className="w-full max-w-5xl space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Skeleton className="h-24 rounded-2xl" />
                                <Skeleton className="h-24 rounded-2xl" />
                                <Skeleton className="h-24 rounded-2xl" />
                            </div>
                            <Skeleton className="h-[60vh] rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user && isPublicRoute) {
        return <div className="w-full bg-background">{children}</div>;
    }

    const handleCreateNew = () => {
        createWorkflow({ name: t('workspace.untitledStudio') }).then(id => {
            if (id) push(`/creator/workflow-editor?workflowId=${id}`);
        });
    };

    const handleDuplicate = async () => {
        if (workflow?.id) {
            const newId = await duplicateWorkflow(workflow.id);
            if (newId) push(`/creator/workflow-editor?workflowId=${newId}`);
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
        // Workflow Editor
        if (isWorkflow) {
            return (
                <div className="flex items-center gap-2">
                    <Link href={WORKSPACE_ROOT.href} className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.personal')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/creator" className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.creator')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded-md transition-colors outline-none">
                                <span className="text-foreground font-medium text-xs">
                                    {workflow?.name || t('workspace.untitledStudio')}
                                </span>
                                <ChevronDown className="size-3 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem onClick={handleCreateNew}>
                                <Plus className="size-4 mr-2" />
                                <span>{t('actions.newSpace')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDuplicate}>
                                <Copy className="size-4 mr-2" />
                                <span>{t('actions.duplicateSpace')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleRenameOpen}>
                                <Edit className="size-4 mr-2" />
                                <span>{t('actions.rename')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }

        // Creator tools
        if (pathname.startsWith('/creator/')) {
            const toolName = pathname.split('/').pop()?.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'Tool';
            const formatName = (name: string) => {
                const map: { [key: string]: string } = {
                    'image-generator': 'Image Generator',
                    'video-generator': 'Video Generator',
                    'image-editor': 'Image Editor',
                    'image-upscaler': 'Image Upscaler',
                    'music-generator': 'Music Generator',
                };
                return map[name.toLowerCase().replace(/ /g, '-')] || name;
            };
            return (
                <div className="flex items-center gap-2 text-xs">
                    <Link href={WORKSPACE_ROOT.href} className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.personal')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/creator" className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.creator')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{formatName(toolName)}</span>
                </div>
            );
        }

        // Creator root
        if (pathname === '/creator') {
            return (
                <div className="flex items-center gap-2 text-xs">
                    <Link href={WORKSPACE_ROOT.href} className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.personal')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{t('workspace.creator')}</span>
                </div>
            );
        }

        // VisualFlow Studio
        if (pathname.startsWith('/visual-flow')) {
            const parts = pathname.split('/').filter(Boolean);
            return (
                <div className="flex items-center gap-2 text-xs">
                    <Link href={WORKSPACE_ROOT.href} className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.personal')}</Link>
                    <span className="text-muted-foreground">/</span>
                    <Link href="/visual-flow" className={cn(
                        'transition-colors',
                        parts.length === 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    )}>
                        {t('workspace.visualFlowStudio')}
                    </Link>
                    {parts.length > 2 && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-foreground font-medium">{t('workspace.project')}</span>
                        </>
                    )}
                </div>
            );
        }

        // Default / Dashboard
        return (
            <div className="flex items-center gap-2 text-xs">
                <Link href={WORKSPACE_ROOT.href} className="text-muted-foreground hover:text-foreground transition-colors">{t('workspace.personal')}</Link>
                {pathname !== '/dashboard' && pathname !== '/' && (
                    <>
                        <span className="text-muted-foreground">/</span>
                        <Link href={pathname} className="text-foreground font-medium hover:text-foreground transition-colors">
                            {pathname === '/creative-studio' ? 'Creative Studio'
                                : (pathname.replace(/^\//, '').split('/')[0].charAt(0).toUpperCase() + pathname.replace(/^\//, '').split('/')[0].slice(1))}
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
                            className="md:hidden size-8"
                            onClick={onMenuClick}
                        >
                            <Menu className="size-5" />
                        </Button>
                        {getBreadcrumbs()}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="hidden sm:flex h-8 gap-2">
                            <Share2 className="size-3.5" />
                            {t('actions.share')}
                        </Button>
                        <div className="hidden sm:block h-4 w-px bg-border mx-1" />

                        <NotificationsMenu />

                        <div className="hidden sm:block h-4 w-px bg-border mx-1" />
                        <UserMenu />
                    </div>
                </header>

                <div className={cn(
                    "flex-1 min-h-0 relative",
                    isWorkflow || isCreatorWorkspace ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
                )}>
                    {children}
                </div>

                <RenameSpaceDialog
                    open={isRenameOpen}
                    onOpenChange={setIsRenameOpen}
                    workflowId={workflow?.id}
                    workflowName={workflow?.name}
                    newName={newName}
                    onNewNameChange={setNewName}
                    onConfirm={confirmRename}
                />
            </div>
        </div>
    );
}

function NotificationsMenu() {
    const { push } = useRouter();
    const t = useTranslations('Layout');
    const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
            void fetchNotifications();
            void fetchUnreadCount();
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 relative">
                    <Bell className="size-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{t('notifications.title')}</h3>
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        {t('notifications.markAllAsRead')}
                    </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-xs space-y-3">
                            <p>{t('notifications.emptyTitle')}</p>
                            <p className="leading-5">
                                {t('notifications.emptyBody')}
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className={cn(
                                    "w-full text-left p-3 border-b border-border hover:bg-muted/50 cursor-pointer flex gap-3 transition-colors",
                                    notification.isRead && "opacity-60"
                                )}
                            >
                                <div className={cn(
                                    "size-8 rounded-full flex items-center justify-center shrink-0",
                                    notification.type === 'success' && "bg-green-500/20 text-green-500",
                                    notification.type === 'info' && "bg-primary/20 text-primary",
                                    notification.type === 'warning' && "bg-yellow-500/20 text-yellow-500",
                                    notification.type === 'error' && "bg-red-500/20 text-red-500",
                                )}>
                                    {notification.type === 'success' ? <Sparkles className="size-4" /> :
                                        <Bell className="size-4" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                                    <p className="text-[10px] text-muted-foreground opacity-50">
                                        {notification.createdAt.slice(0, 10)}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-2 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full text-xs h-8"
                        onClick={() => push('/notifications')}
                    >
                        {t('notifications.viewAll')}
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function RenameSpaceDialog({
    open,
    onOpenChange,
    workflowId,
    workflowName,
    newName,
    onNewNameChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflowId?: string;
    workflowName?: string;
    newName: string;
    onNewNameChange: (value: string) => void;
    onConfirm: () => void;
}) {
    const t = useTranslations('Layout');
    if (!workflowId) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('dialogs.renameSpace')}</DialogTitle>
                    <DialogDescription>
                        {t('dialogs.renameDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input
                            id="link"
                            value={newName}
                            onChange={(e) => onNewNameChange(e.target.value)}
                            placeholder={workflowName ?? t('workspace.untitledStudio')}
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        {t('dialogs.cancel')}
                    </Button>
                    <Button type="button" onClick={onConfirm}>
                        {t('actions.rename')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
