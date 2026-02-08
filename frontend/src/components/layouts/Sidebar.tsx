'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/providers';
import {
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
    Grid3X3,
    Mic,
    Pin,
    PinOff,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CreditBadge } from '@/components/common/CreditBadge';
// import { LocaleSwitcher, ThemeSwitcher } from '@/widgets';

export const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Box, label: 'Stock', href: '/stock' },
    { icon: Globe, label: 'Community', href: '/community' },
];

export const pinnedItems = [
    { icon: ImageIcon, label: 'Image Generator', href: '/creator/image-generator' },
    { icon: Video, label: 'Video Generator', href: '/creator/video-generator' },
    { icon: Sparkles, label: 'Assistant', href: '/creator/ai-assistant' },
    { icon: LayoutGrid, label: 'Creative Studio', href: '/creative-studio', isNew: true },
];

export const bottomItems = [
    { icon: Box, label: 'Projects', href: '/projects' },
    { icon: Clock, label: 'History', href: '/history' },
];

// Comprehensive Tools Data with Icons - SEO-friendly /creator/ routes
export const ALL_TOOLS_LIST = [
    { id: 'image-gen', label: 'Image Generator', href: '/creator/image-generator', icon: ImageIcon, category: 'image' },
    { id: 'image-editor', label: 'Image Editor', href: '/creator/image-editor', icon: ImageIcon, category: 'image' },
    { id: 'image-upscaler', label: 'Image Upscaler', href: '/creator/image-upscaler', icon: ImageIcon, category: 'image' },
    { id: 'image-extender', label: 'Image Extender', href: '/creator/image-extender', icon: ImageIcon, category: 'image' },
    { id: 'variations', label: 'Variations', href: '/creator/variations', icon: Sparkles, category: 'image', isNew: true },
    { id: 'assistant', label: 'Assistant', href: '/creator/ai-assistant', icon: Sparkles, category: 'image' },

    { id: 'video-gen', label: 'Video Generator', href: '/creator/video-generator', icon: Video, category: 'video' },
    { id: 'video-editor', label: 'Video Project Editor', href: '/creator/video-editor', icon: Video, category: 'video' },
    { id: 'clip-editor', label: 'Clip Editor', href: '/creator/clip-editor', icon: Video, category: 'video' },
    { id: 'video-upscaler', label: 'Video Upscaler', href: '/creator/video-upscaler', icon: Video, category: 'video' },
    { id: 'lip-sync', label: 'Lip Sync', href: '/creator/lip-sync', icon: Video, category: 'video' },

    { id: 'voice-gen', label: 'Voice Generator', href: '/creator/voice-generator', icon: Mic, category: 'audio' },
    { id: 'sfx-gen', label: 'Sound Effect Generator', href: '/creator/sfx-generator', icon: Mic, category: 'audio' },
    { id: 'music-gen', label: 'Music Generator', href: '/creator/music-generator', icon: Mic, category: 'audio' },

    { id: 'creative-studio', label: 'Creative Studio', href: '/creative-studio', icon: LayoutGrid, category: 'others', isNew: true },
    { id: 'workflow-editor', label: 'Workflow Editor', href: '/creator/workflow-editor', icon: LayoutGrid, category: 'others', isNew: true },
    { id: 'design-editor', label: 'Design Editor', href: '/creator/design-editor', icon: LayoutGrid, category: 'others' },
    { id: 'mockup-gen', label: 'Mockup Generator', href: '/creator/mockup-generator', icon: LayoutGrid, category: 'others' },
    { id: 'icon-gen', label: 'Icon Generator', href: '/creator/icon-generator', icon: LayoutGrid, category: 'others' },
    { id: 'bg-remover', label: 'Background Remover', href: '/creator/bg-remover', icon: LayoutGrid, category: 'others' },
    { id: 'skin-enhancer', label: 'Skin Enhancer', href: '/creator/skin-enhancer', icon: Sparkles, category: 'others' },
    { id: 'camera-change', label: 'Change Camera', href: '/creator/camera-change', icon: Video, category: 'others', isNew: true },
    { id: 'sketch-to-image', label: 'Sketch to Image', href: '/creator/sketch-to-image', icon: ImageIcon, category: 'others' },
];

export const INITIAL_PINNED_IDS = ['image-gen', 'video-gen', 'assistant', 'creative-studio'];

export const stockMenuData = {
    image: [
        { label: 'All images', href: '/stock/images' },
        { label: 'Vectors', href: '/stock/vectors' },
        { label: 'Photos', href: '/stock/photos' },
        { label: 'Illustrations', href: '/stock/illustrations' },
        { label: 'Icons', href: '/stock/icons' },
        { label: '3D', href: '/stock/3d' },
    ],
    video: [
        { label: 'Videos', href: '/stock/videos' },
        { label: 'Video templates', href: '/stock/video-templates' },
        { label: 'Motion graphics', href: '/stock/motion-graphics' },
    ],
    audio: [
        { label: 'Sound Effects', href: '/stock/sound-effects' },
        { label: 'Music', href: '/stock/music' },
    ],
    design: [
        { label: 'Templates', href: '/stock/templates' },
        { label: 'Mockups', href: '/stock/mockups' },
        { label: 'Fonts', href: '/stock/fonts' },
        { label: 'PSD', href: '/stock/psd' },
    ],
};


// Breakpoints for responsive behavior
const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
};

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [pinnedIds, setPinnedIds] = useState<string[]>([]);
    const { user } = useAuth();

    // Handle responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            if (width < BREAKPOINTS.lg) {
                setIsCollapsed(true);
            }
            setIsMobile(width < BREAKPOINTS.md);
            setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Load pinned status from localStorage
    useEffect(() => {
        if (!user) return;
        const saved = localStorage.getItem('pinned-tools');
        if (saved) {
            setPinnedIds(JSON.parse(saved));
        } else {
            setPinnedIds(INITIAL_PINNED_IDS);
        }
    }, [user]);

    // Save pinned status to localStorage
    useEffect(() => {
        if (!user) return;
        if (pinnedIds.length > 0) {
            localStorage.setItem('pinned-tools', JSON.stringify(pinnedIds));
        }
    }, [pinnedIds, user]);

    if (!user) return null;

    const togglePin = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setPinnedIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const pinnedTools = ALL_TOOLS_LIST.filter(tool => pinnedIds.includes(tool.id));

    const StockHoverContent = () => (
        <div className="w-[600px] p-6 bg-[#151619] border border-white/10 text-white rounded-xl shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Stock</h3>
            <div className="grid grid-cols-4 gap-6">
                {/* IMAGE */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                        <ImageIcon className="w-4 h-4" />
                        IMAGE
                    </div>
                    {stockMenuData.image.map((tool) => (
                        <Link
                            key={tool.label}
                            href={tool.href as any}
                            className="block text-sm text-white/70 hover:text-white transition-colors py-1"
                        >
                            {tool.label}
                        </Link>
                    ))}
                </div>

                {/* VIDEO */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                        <Video className="w-4 h-4" />
                        VIDEO
                    </div>
                    {stockMenuData.video.map((tool) => (
                        <Link
                            key={tool.label}
                            href={tool.href as any}
                            className="block text-sm text-white/70 hover:text-white transition-colors py-1"
                        >
                            {tool.label}
                        </Link>
                    ))}
                </div>

                {/* AUDIO */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                        <Mic className="w-4 h-4" />
                        AUDIO
                    </div>
                    {stockMenuData.audio.map((tool) => (
                        <Link
                            key={tool.label}
                            href={tool.href as any}
                            className="block text-sm text-white/70 hover:text-white transition-colors py-1"
                        >
                            {tool.label}
                        </Link>
                    ))}
                </div>

                {/* DESIGN */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                        <LayoutGrid className="w-4 h-4" />
                        DESIGN
                    </div>
                    {stockMenuData.design.map((tool) => (
                        <Link
                            key={tool.label}
                            href={tool.href as any}
                            className="block text-sm text-white/70 hover:text-white transition-colors py-1"
                        >
                            {tool.label}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex gap-6">
                <Link href="/my-collections" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <LayoutGrid className="w-4 h-4" />
                    My Collections
                </Link>
                <Link href="/downloads" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                    Downloads
                </Link>
            </div>
        </div>
    );

    const NavItem = ({ item }: { item: any }) => {
        const content = (
            <Link
                href={item.href as any}
                className={cn(
                    "flex items-center w-full px-3 py-2.5 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/5",
                    pathname === item.href && "text-white bg-white/5 font-medium",
                    isCollapsed ? "justify-center px-2" : "justify-between"
                )}
            >
                <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded">New</span>
                )}
                {isCollapsed && item.isNew && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
            </Link>
        );

        if (item.label === 'Stock' && !isCollapsed) {
            return (
                <HoverCard openDelay={0} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        {content}
                    </HoverCardTrigger>
                    <HoverCardContent
                        side="right"
                        align="start"
                        className="p-0 bg-transparent border-none shadow-none w-auto ml-2"
                    >
                        <StockHoverContent />
                    </HoverCardContent>
                </HoverCard>
            );
        }

        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {content}
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right" className="bg-[#1A1B1F] border-white/10 text-white">
                            <div className="flex items-center gap-2">
                                {item.label}
                                {item.isNew && <span className="px-1 py-0.5 text-[9px] font-bold text-blue-400 bg-blue-500/10 rounded">New</span>}
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    };

    // All Tools Hover Menu Item
    const AllToolsMenuItem = () => (
        <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
                <button
                    className={cn(
                        "flex items-center w-full px-3 py-2.5 text-sm text-white/60 rounded-lg transition-all duration-200 hover:text-white hover:bg-white/5",
                        isCollapsed ? "justify-center px-2" : "justify-between"
                    )}
                >
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
                        <Grid3X3 className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>All tools</span>}
                    </div>
                </button>
            </HoverCardTrigger>
            <HoverCardContent
                side="right"
                align="start"
                className="w-[700px] p-0 bg-[#151619] border-white/10 text-white rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">All tools</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 ring-blue-500/50 w-64"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-8">
                        {['image', 'video', 'audio', 'others'].map((cat) => (
                            <div key={cat} className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                                    {cat === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                    {cat === 'video' && <Video className="w-3.5 h-3.5" />}
                                    {cat === 'audio' && <Mic className="w-3.5 h-3.5" />}
                                    {cat === 'others' && <Sparkles className="w-3.5 h-3.5" />}
                                    {cat}
                                </div>
                                <div className="space-y-1">
                                    {ALL_TOOLS_LIST.filter(t => t.category === cat).map((tool) => (
                                        <Link
                                            key={tool.id}
                                            href={tool.href as any}
                                            className="group flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-sm transition-colors",
                                                    pinnedIds.includes(tool.id) ? "text-white font-medium" : "text-white/60 group-hover:text-white"
                                                )}>
                                                    {tool.label}
                                                </span>
                                                {tool.isNew && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1 rounded">New</span>}
                                            </div>
                                            <button
                                                onClick={(e) => togglePin(e, tool.id)}
                                                className={cn(
                                                    "opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/10 rounded",
                                                    pinnedIds.includes(tool.id) && "opacity-100 text-blue-400"
                                                )}
                                            >
                                                {pinnedIds.includes(tool.id) ? (
                                                    <Pin className="w-3.5 h-3.5 fill-current" />
                                                ) : (
                                                    <Pin className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/[0.02] p-4 flex items-center justify-center border-t border-white/5">
                    <button className="text-xs text-white/40 hover:text-white transition-colors">
                        View all tools in a single list
                    </button>
                </div>
            </HoverCardContent>
        </HoverCard>
    );

    return (
        <>
            <aside
                className={cn(
                    "h-screen bg-[#0B0C0E] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0",
                    isCollapsed ? "w-[72px]" : "w-64"
                )}
            >
                {/* Header - AI Generator Brand */}
                <div className={cn(
                    "h-14 flex items-center border-b border-white/5 shrink-0",
                    isCollapsed ? "justify-center px-2" : "px-4"
                )}>
                    {!isCollapsed ? (
                        <div className="flex items-center w-full gap-2 group">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                                    <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-tight leading-tight">PaintAI</span>
                                    <span className="text-[9px] text-white/40 font-medium">Your paint, your choice</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white/40 hover:text-white shrink-0"
                                onClick={() => setIsCollapsed(true)}
                            >
                                <PanelLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        isTablet ? (
                            <div className="w-10 h-10 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center p-1 bg-white/5 border border-white/10">
                                    <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        ) : (
                            <button
                                className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-white/60 hover:text-white"
                                onClick={() => setIsCollapsed(false)}
                            >
                                <img src="/logo.svg" alt="Logo" className="w-6 h-6 object-contain" />
                            </button>
                        )
                    )}
                </div>

                {/* Personal Workspace Selector - Hidden when collapsed */}
                {!isCollapsed && (
                    <div className="px-3 py-3 border-b border-white/5">
                        <button className="flex items-center gap-2 text-sm text-white/60 hover:text-white hover:bg-white/5 px-2 py-2 rounded-lg transition-colors w-full text-left">
                            <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                                P
                            </div>
                            <span className="flex-1">Personal</span>
                            <ChevronDown className="w-3 h-3 text-white/40" />
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-hide">
                    {/* Main Nav */}
                    <div className="space-y-0.5">
                        {navItems.map((item) => (
                            <NavItem key={item.label} item={item} />
                        ))}
                    </div>

                    {/* Divider */}
                    {isCollapsed ? (
                        <div className="h-px w-8 bg-white/5 mx-auto my-3" />
                    ) : (
                        <div className="px-3 py-3">
                            <h3 className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Pinned</h3>
                        </div>
                    )}

                    {/* Pinned Tools */}
                    <div className="space-y-0.5">
                        {pinnedTools.map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}

                        {/* All Tools - Hover to expand */}
                        <AllToolsMenuItem />
                    </div>

                    {/* Divider */}
                    {isCollapsed ? (
                        <div className="h-px w-8 bg-white/5 mx-auto my-3" />
                    ) : (
                        <div className="h-px bg-white/5 mx-3 my-3" />
                    )}

                    {/* Bottom Section */}
                    <div className="space-y-0.5">
                        {bottomItems.map((item) => (
                            <NavItem key={item.label} item={item} />
                        ))}
                    </div>
                </div>

                {/* Footer / Plan */}
                <div className={cn("border-t border-white/5 shrink-0", isCollapsed ? "p-2" : "p-3")}>
                    {/* Credit Balance */}
                    {!isCollapsed && (
                        <div className="mb-3">
                            <CreditBadge className="w-full justify-center" />
                        </div>
                    )}

                    {/* Theme & Language Switchers */}
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2 mb-3">
                            {/* Switchers removed as they are in UserMenu */}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 mb-3">
                            {/* Switchers removed as they are in UserMenu */}
                        </div>
                    )}

                    {!isCollapsed ? (
                        <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-4 border border-orange-500/20 space-y-2">
                            <h4 className="text-sm font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Get a plan</h4>
                            <p className="text-[11px] text-white/50">Unlock more features</p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-orange-400 bg-orange-400/10 rounded-xl hover:bg-orange-400/20">
                                            <Sparkles className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#1A1B1F] border-white/10 text-white">
                                        Upgrade Plan
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </aside>
            {
                isTablet && !isCollapsed && (
                    <div className="w-[72px] shrink-0 h-full hidden md:block" aria-hidden="true" />
                )
            }
        </>
    );
}
