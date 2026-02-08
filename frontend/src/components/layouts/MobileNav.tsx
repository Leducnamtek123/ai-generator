'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/providers';
import {
    Menu,
    X,
    Home,
    Image as ImageIcon,
    Video,
    Sparkles,
    LayoutGrid,
    Clock,
    ChevronDown,
    MoreHorizontal,
    Box,
    Globe,
    PanelLeft,
    Mic,
    Pin,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
// import { LocaleSwitcher, ThemeSwitcher } from '@/widgets';

import {
    navItems,
    pinnedItems,
    bottomItems,
    ALL_TOOLS_LIST,
    INITIAL_PINNED_IDS
} from './Sidebar';

interface MobileNavProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MobileNav({ isOpen, onOpenChange }: MobileNavProps) {
    const pathname = usePathname();
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);
    const { user } = useAuth();

    // Sync pinned items
    useEffect(() => {
        if (!user) return;
        const saved = localStorage.getItem('pinned-tools');
        if (saved) {
            setPinnedIds(JSON.parse(saved));
        } else {
            setPinnedIds(INITIAL_PINNED_IDS);
        }
    }, [user, isOpen]); // Re-read when opening

    const togglePin = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newIds = pinnedIds.includes(id)
            ? pinnedIds.filter(p => p !== id)
            : [...pinnedIds, id];

        setPinnedIds(newIds);
        localStorage.setItem('pinned-tools', JSON.stringify(newIds));
    };

    const pinnedTools = ALL_TOOLS_LIST.filter(tool => pinnedIds.includes(tool.id));

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Close on route change
    useEffect(() => {
        onOpenChange(false);
    }, [pathname, onOpenChange]);

    const NavItem = ({ item }: { item: any }) => (
        <Link
            href={item.href as any}
            className={cn(
                "flex items-center w-full px-4 py-3 text-base text-white/60 rounded-xl transition-all duration-200 hover:text-white hover:bg-white/5",
                pathname === item.href && "text-white bg-white/5 font-medium"
            )}
        >
            <item.icon className="w-5 h-5 mr-3 shrink-0" />
            <span>{item.label}</span>
            {item.isNew && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded">New</span>
            )}
        </Link>
    );

    if (!user) return null;

    return (
        <div className="md:hidden">

            {/* Overlay Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/80 z-[99] backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />
                    <div
                        className="fixed inset-0 w-full h-full bg-[#0B0C0E] z-[100] flex flex-col overflow-hidden"
                    >
                        {/* Drawer Header */}
                        <div className="flex flex-col items-center justify-center pt-10 pb-6 px-4 border-b border-white/5 shrink-0 relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/40 hover:text-white absolute top-2 right-2"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center p-1 bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white tracking-tight">PaintAI</span>
                                    <span className="text-xs text-white/50 font-medium mt-1">Your paint, your choice</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Workspace */}
                            <div>
                                <button className="flex items-center gap-2 text-sm text-white bg-white/5 px-3 py-2 rounded-lg w-full">
                                    <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        P
                                    </div>
                                    <span className="flex-1 text-left">Personal</span>
                                    <ChevronDown className="w-4 h-4 text-white/40" />
                                </button>
                            </div>

                            {/* Main Nav */}
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <NavItem key={item.label} item={item} />
                                ))}
                            </div>

                            {/* Pinned */}
                            <div className="space-y-1">
                                <div className="px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                                    Pinned Tools
                                </div>
                                {pinnedTools.map((item) => (
                                    <NavItem key={item.id} item={item} />
                                ))}
                            </div>

                            {/* Bottom */}
                            <div className="space-y-1 pt-4 border-t border-white/5">
                                {bottomItems.map((item) => (
                                    <NavItem key={item.label} item={item} />
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-[#151619]">
                            <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-4 border border-orange-500/20 mb-4">
                                <h4 className="text-sm font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Get a plan</h4>
                                <p className="text-xs text-white/50 mt-1">Unlock more features</p>
                            </div>

                            <div className="flex items-center justify-between text-white/40">
                                <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5">
                                    <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</div>
                                </Button>
                                {/* Theme & Locale switchers removed as they are in UserMenu */}
                                <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5 relative">
                                    <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">&bull;</div>
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#151619]" />
                                </Button>
                                <Button variant="ghost" size="icon" className="hover:text-white hover:bg-white/5">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
