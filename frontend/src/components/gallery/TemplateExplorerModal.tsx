'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import {
    Box,
    Image as ImageIcon,
    LayoutGrid,
    Loader2,
    Mic,
    Music,
    Search,
    Sparkles,
    Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useInfiniteTemplates } from '@/hooks/useTemplates';
import { Template, TemplateTypeEnum } from '@/lib/api/templates';
import { cn } from '@/lib/utils';

type TemplateScope = 'all' | 'my-templates' | TemplateTypeEnum;
type TemplateSort = 'all' | 'recent' | 'popular';

type TemplateExplorerModalProps = {
    children?: React.ReactNode;
    defaultCategory?: TemplateScope;
    defaultSort?: TemplateSort;
    title?: string;
    description?: string;
    onSelectTemplate?: (template: Template) => void;
};

type TemplateCategory = {
    id: TemplateScope;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
};

type TemplateBrowserCardProps = {
    template: Template;
    onUse: () => void;
};

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    {
        id: 'all',
        label: 'All templates',
        description: 'Browse every template in the catalog',
        icon: LayoutGrid,
    },
    {
        id: 'my-templates',
        label: 'My templates',
        description: 'Templates created by the signed-in user',
        icon: Sparkles,
    },
    {
        id: TemplateTypeEnum.IMAGE_GENERATOR,
        label: 'Images',
        description: 'Image prompts and visual workflows',
        icon: ImageIcon,
    },
    {
        id: TemplateTypeEnum.VIDEO_GENERATOR,
        label: 'Videos',
        description: 'Video prompts and motion workflows',
        icon: Video,
    },
    {
        id: TemplateTypeEnum.MUSIC_GENERATOR,
        label: 'Music',
        description: 'Music prompts and composition presets',
        icon: Music,
    },
    {
        id: TemplateTypeEnum.VOICE_GENERATOR,
        label: 'Voice',
        description: 'Voice prompts and narration presets',
        icon: Mic,
    },
    {
        id: TemplateTypeEnum.WORKFLOW_EDITOR,
        label: 'Workflows',
        description: 'Reusable node graphs and automation flows',
        icon: Box,
    },
    {
        id: TemplateTypeEnum.AI_ASSISTANT,
        label: 'Assistant',
        description: 'Assistant prompts and helper flows',
        icon: Sparkles,
    },
    {
        id: TemplateTypeEnum.DESIGN_EDITOR,
        label: 'Design',
        description: 'Design layouts, mockups, and systems',
        icon: Sparkles,
    },
    {
        id: TemplateTypeEnum.IMAGE_UPSCALER,
        label: 'Image upscaler',
        description: 'Sharpening and enhancement presets',
        icon: ImageIcon,
    },
    {
        id: TemplateTypeEnum.VIDEO_UPSCALER,
        label: 'Video upscaler',
        description: 'Video enhancement presets',
        icon: Video,
    },
    {
        id: TemplateTypeEnum.ICON_GENERATOR,
        label: 'Icons',
        description: 'Icon sets and asset packs',
        icon: Sparkles,
    },
    {
        id: TemplateTypeEnum.MOCKUP_GENERATOR,
        label: 'Mockups',
        description: 'Product mockups and preview systems',
        icon: Box,
    },
    {
        id: TemplateTypeEnum.BG_REMOVER,
        label: 'BG remover',
        description: 'Background removal presets',
        icon: ImageIcon,
    },
    {
        id: TemplateTypeEnum.SOUND_EFFECT_GENERATOR,
        label: 'SFX',
        description: 'Sound effect prompts and packs',
        icon: Music,
    },
];

const TEMPLATE_SORTS: Array<{ id: TemplateSort; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'New' },
    { id: 'popular', label: 'Featured' },
];

const ROUTES_BY_TEMPLATE_TYPE: Partial<Record<TemplateTypeEnum, string>> = {
    [TemplateTypeEnum.IMAGE_GENERATOR]: '/creator/image-generator',
    [TemplateTypeEnum.VIDEO_GENERATOR]: '/creator/video-generator',
    [TemplateTypeEnum.WORKFLOW_EDITOR]: '/creator/workflow-editor',
    [TemplateTypeEnum.DESIGN_EDITOR]: '/creator/design-editor',
    [TemplateTypeEnum.IMAGE_UPSCALER]: '/creator/image-upscaler',
    [TemplateTypeEnum.VIDEO_UPSCALER]: '/creator/video-upscaler',
    [TemplateTypeEnum.MUSIC_GENERATOR]: '/creator/music-generator',
    [TemplateTypeEnum.VOICE_GENERATOR]: '/creator/voice-generator',
    [TemplateTypeEnum.AI_ASSISTANT]: '/creator/ai-assistant',
    [TemplateTypeEnum.SOUND_EFFECT_GENERATOR]: '/creator/sfx-generator',
    [TemplateTypeEnum.ICON_GENERATOR]: '/creator/icon-generator',
    [TemplateTypeEnum.MOCKUP_GENERATOR]: '/creator/mockup-generator',
    [TemplateTypeEnum.BG_REMOVER]: '/creator/bg-remover',
};

const MAX_PAGE_SIZE = 20;

export function TemplateExplorerModal({
    children,
    defaultCategory = 'all',
    defaultSort = 'all',
    title = 'Templates',
    description = 'Browse templates and reuse them in one click.',
    onSelectTemplate,
}: TemplateExplorerModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<TemplateScope>(defaultCategory);
    const [selectedSort, setSelectedSort] = useState<TemplateSort>(defaultSort);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setSelectedCategory(defaultCategory);
            setSelectedSort(defaultSort);
            setSearchQuery('');
        }

        setIsOpen(nextOpen);
    };

    const queryParams = useMemo(() => {
        if (selectedCategory === 'my-templates') {
            return { limit: MAX_PAGE_SIZE, mode: 'my-templates' };
        }

        if (selectedCategory !== 'all') {
            return { limit: MAX_PAGE_SIZE, type: selectedCategory };
        }

        return { limit: MAX_PAGE_SIZE };
    }, [selectedCategory]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        error,
        refetch,
    } = useInfiniteTemplates(queryParams);
    const { ref, inView } = useInView({ rootMargin: '500px 0px' });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

    const templates = useMemo(() => {
        const allTemplates = data?.pages.flatMap((page) => page.data) ?? [];
        const normalizedSearch = searchQuery.trim().toLowerCase();

        const filtered = normalizedSearch
            ? allTemplates.filter((template) => {
                const titleText = template.title.toLowerCase();
                const descriptionText = template.description?.toLowerCase() ?? '';
                const authorText = [template.author?.firstName, template.author?.lastName, template.author?.email]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return (
                    titleText.includes(normalizedSearch) ||
                    descriptionText.includes(normalizedSearch) ||
                    authorText.includes(normalizedSearch)
                );
            })
            : allTemplates;

        if (selectedSort === 'popular') {
            return [...filtered].sort((left, right) => {
                if (right.usageCount !== left.usageCount) {
                    return right.usageCount - left.usageCount;
                }

                return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
            });
        }

        if (selectedSort === 'recent') {
            return [...filtered].sort((left, right) => {
                return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
            });
        }

        return filtered;
    }, [data?.pages, searchQuery, selectedSort]);

    const activeCategory = TEMPLATE_CATEGORIES.find((category) => category.id === selectedCategory) ?? TEMPLATE_CATEGORIES[0];
    const isInitialLoading = status === 'pending';
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';

    const handleUseTemplate = (template: Template) => {
        if (onSelectTemplate) {
            onSelectTemplate(template);
            setIsOpen(false);
            return;
        }

        const targetRoute = ROUTES_BY_TEMPLATE_TYPE[template.type] ?? '/creator/image-generator';
        router.push(`${targetRoute}?templateId=${template.id}`);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="min-w-[200px]">
                        Browse templates
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="h-[88vh] w-[min(1600px,calc(100vw-2rem))] max-w-none overflow-hidden border border-border bg-background p-0 text-foreground shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:rounded-[28px]">
                <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-b border-border bg-muted/30 p-4 lg:border-b-0 lg:border-r">
                        <div className="mb-4">
                            <h2 className="mt-2 text-xl font-semibold">{title}</h2>
                        </div>

                        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                            {TEMPLATE_CATEGORIES.map((category) => {
                                const Icon = category.icon;
                                const isActive = selectedCategory === category.id;

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={cn(
                                        'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-foreground shadow-inner'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border',
                                            isActive ? 'border-primary/20 bg-primary/10' : 'border-border bg-background/50'
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">{category.label}</span>
                                        <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                                            {category.description}
                                        </span>
                                    </span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <main className="flex min-h-0 flex-col">
                        <div className="border-b border-border px-5 py-5 lg:px-6">
                            <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="min-w-0">
                                        <h3 className="text-2xl font-semibold text-foreground">{activeCategory.label}</h3>
                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
                                </div>

                                    <div className="flex items-center gap-2">
                                        {TEMPLATE_SORTS.map((sort) => (
                                            <button
                                                key={sort.id}
                                                type="button"
                                                onClick={() => setSelectedSort(sort.id)}
                                                className={cn(
                                                    'rounded-full px-4 py-2 text-xs font-medium transition-colors',
                                                    selectedSort === sort.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                                                )}
                                            >
                                                {sort.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="relative w-full max-w-2xl">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(event) => setSearchQuery(event.target.value)}
                                            placeholder="Search templates"
                                            className="h-12 rounded-full border-border bg-background/70 pl-11 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span>{templates.length} results</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6">
                            {status === 'error' ? (
                                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-muted/30 px-6 text-center">
                                    <p className="text-lg font-semibold text-foreground">Failed to load templates</p>
                                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{errorMessage}</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-5 border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
                                        onClick={() => refetch()}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            ) : isInitialLoading ? (
                                <TemplateBrowserSkeletonGrid />
                            ) : templates.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                        {templates.map((template) => (
                                            <TemplateBrowserCard
                                                key={template.id}
                                                template={template}
                                                onUse={() => handleUseTemplate(template)}
                                            />
                                        ))}
                                    </div>

                                    <div ref={ref} className="flex min-h-16 items-center justify-center py-5">
                                        {isFetchingNextPage ? (
                                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                        ) : hasNextPage ? (
                                            <span className="text-xs text-muted-foreground">Scroll to load more</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">End of templates</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-muted/30 px-6 text-center">
                                    <Sparkles className="size-10 text-muted-foreground/40" />
                                    <p className="mt-4 text-lg font-semibold text-foreground">No templates found</p>
                                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                        Try a different category or clear the search query to load more results.
                                    </p>
                                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Clear search
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-border bg-background text-foreground hover:bg-accent hover:text-foreground"
                                            onClick={() => setSelectedCategory('all')}
                                        >
                                            Show all
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TemplateBrowserCard({ template, onUse }: TemplateBrowserCardProps) {
    const previewText = getTemplatePreviewText(template);
    const createdAtLabel = formatRelativeDate(template.createdAt);
    const authorLabel = getTemplateAuthorLabel(template);

    return (
        <button
            type="button"
            onClick={onUse}
            className="group flex overflow-hidden rounded-[24px] border border-border bg-card text-left transition-all duration-200 hover:border-border/80 hover:bg-card/80"
        >
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-foreground/80">
                            {getTemplateTypeLabel(template.type)}
                        </span>
                        <span className="hidden sm:inline">{createdAtLabel}</span>
                    </div>
                    <div>
                        <h4 className="line-clamp-2 text-lg font-semibold leading-6 text-foreground">{template.title}</h4>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{previewText}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{authorLabel}</span>
                    <span className="size-1 rounded-full bg-muted-foreground/30" />
                    <span>{template.usageCount > 0 ? `${template.usageCount} uses` : 'New'}</span>
                </div>
            </div>

            <div className="relative w-[132px] shrink-0 overflow-hidden sm:w-[150px] md:w-[164px]">
                {template.thumbnail ? (
                    <Image
                        src={template.thumbnail}
                        alt={template.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 140px, 164px"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="size-7 text-muted-foreground/35" />
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-l from-foreground/10 via-transparent to-transparent" />
            </div>
        </button>
    );
}

function TemplateBrowserSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
                <div
                    key={`template-browser-skeleton-${index}`}
                    className="flex overflow-hidden rounded-[24px] border border-border bg-card/60"
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                        <div className="h-4 w-24 rounded-full bg-muted" />
                        <div className="space-y-2">
                            <div className="h-4 w-4/5 rounded-full bg-muted" />
                            <div className="h-4 w-3/5 rounded-full bg-muted" />
                            <div className="h-4 w-2/3 rounded-full bg-muted" />
                        </div>
                        <div className="h-3 w-28 rounded-full bg-muted" />
                    </div>
                    <div className="w-[132px] shrink-0 bg-muted sm:w-[150px] md:w-[164px]" />
                </div>
            ))}
        </div>
    );
}

function getTemplateTypeLabel(type: string) {
    switch (type) {
        case TemplateTypeEnum.IMAGE_GENERATOR:
            return 'Image';
        case TemplateTypeEnum.VIDEO_GENERATOR:
            return 'Video';
        case TemplateTypeEnum.MUSIC_GENERATOR:
            return 'Music';
        case TemplateTypeEnum.VOICE_GENERATOR:
            return 'Voice';
        case TemplateTypeEnum.WORKFLOW_EDITOR:
            return 'Workflow';
        case TemplateTypeEnum.AI_ASSISTANT:
            return 'Assistant';
        case TemplateTypeEnum.DESIGN_EDITOR:
            return 'Design';
        case TemplateTypeEnum.IMAGE_UPSCALER:
            return 'Image upscale';
        case TemplateTypeEnum.VIDEO_UPSCALER:
            return 'Video upscale';
        case TemplateTypeEnum.ICON_GENERATOR:
            return 'Icon';
        case TemplateTypeEnum.MOCKUP_GENERATOR:
            return 'Mockup';
        case TemplateTypeEnum.BG_REMOVER:
            return 'BG remover';
        case TemplateTypeEnum.SOUND_EFFECT_GENERATOR:
            return 'SFX';
        default:
            return 'Template';
    }
}

function getTemplateAuthorLabel(template: Template) {
    const firstName = template.author?.firstName?.trim();
    const lastName = template.author?.lastName?.trim();

    if (firstName || lastName) {
        return [firstName, lastName].filter(Boolean).join(' ');
    }

    if (template.author?.email) {
        return template.author.email.split('@')[0];
    }

    return 'Community';
}

function getTemplatePreviewText(template: Template) {
    const content = template.content;

    if (content && typeof content === 'object' && !Array.isArray(content)) {
        const candidateKeys = ['prompt', 'promptBody', 'summary', 'description', 'note', 'text'];

        for (const key of candidateKeys) {
            const value = (content as Record<string, unknown>)[key];
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
        }
    }

    return template.description?.trim() || template.title;
}

function formatRelativeDate(value: string) {
    const createdAt = new Date(value);
    if (Number.isNaN(createdAt.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
    }).format(createdAt);
}
