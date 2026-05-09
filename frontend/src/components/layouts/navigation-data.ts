import type { LucideIcon } from 'lucide-react';
import {
    Box,
    Bell,
    Clapperboard,
    Clock,
    Globe,
    Home,
    Image as ImageIcon,
    ImagePlus,
    LayoutDashboard,
    LayoutGrid,
    Mic,
    Music,
    Search,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Video,
    Wand2,
    Share2,
} from 'lucide-react';

type ToolCategoryId = 'image' | 'video' | 'audio' | 'others';

export interface SidebarItem {
    icon: LucideIcon;
    label: string;
    href: string;
    id?: string;
    category?: ToolCategoryId;
    isNew?: boolean;
    pinnedByDefault?: boolean;
}

interface ToolCategory {
    id: ToolCategoryId;
    label: string;
    icon: LucideIcon;
}

interface ToolHighlight {
    icon: LucideIcon;
    label: string;
    href: string;
    color?: string;
    isNew?: boolean;
}

interface TemplateSeed {
    id: string;
    title: string;
    thumbnail: string;
}

export type NavigationItemOverride = {
    id: string;
    label?: string;
    href?: string;
    isNew?: boolean;
    pinnedByDefault?: boolean;
    category?: ToolCategoryId;
};

export type NavigationConfig = {
    navItems?: NavigationItemOverride[];
    socialItems?: NavigationItemOverride[];
    bottomItems?: NavigationItemOverride[];
    allToolsList?: NavigationItemOverride[];
    imageGeneratorPresetTemplates?: {
        new?: TemplateSeed[];
        featured?: TemplateSeed[];
    };
};

export const PINNED_STORAGE_KEY = 'pinned-tools';
export const WORKSPACE_ROOT = { label: 'Personal', href: '/dashboard' } as const;
export const CONTENT_TABS = ['Personal', 'Community', 'Templates', 'Tutorials'] as const;
export const COMMUNITY_TAB = CONTENT_TABS[1];
export const TEMPLATES_TAB = CONTENT_TABS[2];
export const GALLERY_TABS = ['Personal', 'Community', 'Tutorials'] as const;
export const MUSIC_CONTENT_TABS = ['My Creations', 'Community', 'Templates', 'Tutorials'] as const;
export const DASHBOARD_TAGS = ['Templates', 'Community', 'Tutorials'] as const;

const navItems: SidebarItem[] = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Box, label: 'Stock', href: '/stock' },
    { icon: Globe, label: 'Community', href: '/community' },
];

export const socialItems: SidebarItem[] = [
    { icon: LayoutGrid, label: 'Social Hub', href: '/social' },
    { icon: LayoutDashboard, label: 'Social Dashboard', href: '/social/dashboard' },
    { icon: Share2, label: 'Channels', href: '/social/channels' },
    { icon: Clock, label: 'Calendar', href: '/social/calendar' },
    { icon: Sparkles, label: 'Publish', href: '/social/publish' },
    { icon: MessageSquare, label: 'Interaction Inbox', href: '/social/inbox', isNew: true },
];

const bottomItems: SidebarItem[] = [
    { icon: Box, label: 'Projects', href: '/projects' },
    { icon: Clock, label: 'History', href: '/history' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: ShieldCheck, label: 'Admin', href: '/admin' },
    { icon: LayoutGrid, label: 'Settings', href: '/settings' },
];

export const TOOL_CATEGORIES: ToolCategory[] = [
    { id: 'image', label: 'IMAGE', icon: ImageIcon },
    { id: 'video', label: 'VIDEO', icon: Video },
    { id: 'audio', label: 'AUDIO', icon: Mic },
    { id: 'others', label: 'OTHERS', icon: Sparkles },
];

export const ALL_TOOLS_LIST: SidebarItem[] = [
    { id: 'image-gen', label: 'Image Generator', href: '/creator/image-generator', icon: ImageIcon, category: 'image', pinnedByDefault: true },
    { id: 'image-editor', label: 'Image Editor', href: '/creator/image-editor', icon: ImageIcon, category: 'image' },
    { id: 'image-upscaler', label: 'Image Upscaler', href: '/creator/image-upscaler', icon: ImageIcon, category: 'image' },
    { id: 'image-extender', label: 'Image Extender', href: '/creator/image-extender', icon: ImageIcon, category: 'image' },
    { id: 'variations', label: 'Variations', href: '/creator/variations', icon: Sparkles, category: 'image', isNew: true },
    { id: 'assistant', label: 'Assistant', href: '/creator/ai-assistant', icon: Sparkles, category: 'image', pinnedByDefault: true },
    { id: 'video-gen', label: 'Video Generator', href: '/creator/video-generator', icon: Video, category: 'video', pinnedByDefault: true },
    { id: 'video-editor', label: 'Video Project Editor', href: '/creator/video-editor', icon: Video, category: 'video' },
    { id: 'clip-editor', label: 'Clip Editor', href: '/creator/clip-editor', icon: Video, category: 'video' },
    { id: 'video-upscaler', label: 'Video Upscaler', href: '/creator/video-upscaler', icon: Video, category: 'video' },
    { id: 'lip-sync', label: 'Lip Sync', href: '/creator/lip-sync', icon: Video, category: 'video' },
    { id: 'voice-gen', label: 'Voice Generator', href: '/creator/voice-generator', icon: Mic, category: 'audio' },
    { id: 'sfx-gen', label: 'Sound Effect Generator', href: '/creator/sfx-generator', icon: Mic, category: 'audio' },
    { id: 'music-gen', label: 'Music Generator', href: '/creator/music-generator', icon: Mic, category: 'audio' },
    { id: 'creative-studio', label: 'Creative Studio', href: '/creative-studio', icon: LayoutGrid, category: 'others', isNew: true, pinnedByDefault: true },
    { id: 'visual-flow', label: 'VisualFlow Studio', href: '/visual-flow', icon: Clapperboard, category: 'others', isNew: true, pinnedByDefault: true },
    { id: 'workflow-editor', label: 'Workflow Editor', href: '/creator/workflow-editor', icon: LayoutGrid, category: 'others', isNew: true },
    { id: 'design-editor', label: 'Design Editor', href: '/creator/design-editor', icon: LayoutGrid, category: 'others' },
    { id: 'mockup-gen', label: 'Mockup Generator', href: '/creator/mockup-generator', icon: LayoutGrid, category: 'others' },
    { id: 'icon-gen', label: 'Icon Generator', href: '/creator/icon-generator', icon: LayoutGrid, category: 'others' },
    { id: 'bg-remover', label: 'Background Remover', href: '/creator/bg-remover', icon: LayoutGrid, category: 'others' },
    { id: 'skin-enhancer', label: 'Skin Enhancer', href: '/creator/skin-enhancer', icon: Sparkles, category: 'others' },
    { id: 'camera-change', label: 'Change Camera', href: '/creator/camera-change', icon: Video, category: 'others', isNew: true },
    { id: 'sketch-to-image', label: 'Sketch to Image', href: '/creator/sketch-to-image', icon: ImageIcon, category: 'others' },
];

export const DEFAULT_PINNED_TOOL_IDS = ALL_TOOLS_LIST
    .reduce<string[]>((ids, tool) => {
        if (tool.pinnedByDefault && tool.id) {
            ids.push(tool.id);
        }
        return ids;
    }, []);

export const CREATOR_TOOL_HIGHLIGHTS: ToolHighlight[] = [
    { icon: Search, label: 'Find assets', href: '/stock' },
    { icon: LayoutGrid, label: 'Spaces', href: '/spaces', isNew: true, color: 'text-chart-1' },
    { icon: ImagePlus, label: 'Image Gen', href: '/creator/image-generator', color: 'text-chart-2' },
    { icon: Video, label: 'Video Gen', href: '/creator/video-generator', color: 'text-chart-3' },
    { icon: Wand2, label: 'Editor', href: '/creator/image-editor' },
    { icon: Sparkles, label: 'Upscaler', href: '/creator/image-upscaler', color: 'text-chart-4' },
    { icon: Box, label: '3D Models', href: '/stock' },
    { icon: Music, label: 'Audio', href: '/creator/music-generator' },
];

const IMAGE_GENERATOR_PRESET_TEMPLATES: { new: TemplateSeed[]; featured: TemplateSeed[] } = {
    new: [
        { id: '1', title: 'Create funny Valentine costume', thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop' },
        { id: '2', title: 'Create Valentine photobooth...', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
        { id: '3', title: 'Create a close-up confession', thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop' },
        { id: '4', title: 'Create a thriller scene', thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop' },
        { id: '5', title: 'Capture an epic wide shot', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop' },
        { id: '6', title: 'Frame an over-the-shoulder d...', thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' },
    ],
    featured: [
        { id: 'f1', title: 'Turn character into realistic p...', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop' },
        { id: 'f2', title: 'Turn product image into a ca...', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
        { id: 'f3', title: 'Create analog-style photos', thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop' },
        { id: 'f4', title: 'Swap character', thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop' },
        { id: 'f5', title: 'Create cinematic frame', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop' },
        { id: 'f6', title: 'Reveal scene behind the shot', thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' },
    ],
};

const mergeSidebarItems = (defaults: SidebarItem[], overrides?: NavigationItemOverride[]) => {
    if (!overrides?.length) return defaults;

    const overrideMap = new Map(overrides.map((item) => [item.id, item]));

    return defaults.map((item) => {
        if (!item.id) return item;
        const override = overrideMap.get(item.id);
        if (!override) return item;
        return {
            ...item,
            ...override,
        };
    });
};

export const mergeNavigationData = (overrides?: NavigationConfig) => ({
    navItems: mergeSidebarItems(navItems, overrides?.navItems),
    socialItems: mergeSidebarItems(socialItems, overrides?.socialItems),
    bottomItems: mergeSidebarItems(bottomItems, overrides?.bottomItems),
    allToolsList: mergeSidebarItems(ALL_TOOLS_LIST, overrides?.allToolsList),
    imageGeneratorPresetTemplates: {
        new: overrides?.imageGeneratorPresetTemplates?.new?.length
            ? overrides.imageGeneratorPresetTemplates.new
            : IMAGE_GENERATOR_PRESET_TEMPLATES.new,
        featured: overrides?.imageGeneratorPresetTemplates?.featured?.length
            ? overrides.imageGeneratorPresetTemplates.featured
            : IMAGE_GENERATOR_PRESET_TEMPLATES.featured,
    },
});
