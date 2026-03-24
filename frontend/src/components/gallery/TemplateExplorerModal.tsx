'use client';

import React, { useState, useEffect } from 'react';
import { useInfiniteTemplates } from '@/hooks/useTemplates';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Image, Video, Music, Box, LayoutGrid, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';
import { TemplateCard } from './TemplateCard';

import { Template, TemplateTypeEnum } from '@/lib/api/templates';

const CATEGORIES = [
    { id: 'all', label: 'All templates', icon: LayoutGrid },
    { id: 'my-templates', label: 'My templates', icon: Sparkles },
    { id: TemplateTypeEnum.IMAGE_GENERATOR, label: 'Images', icon: Image },
    { id: TemplateTypeEnum.VIDEO_GENERATOR, label: 'Videos', icon: Video },
    { id: TemplateTypeEnum.MUSIC_GENERATOR, label: 'Music', icon: Music },
    { id: TemplateTypeEnum.WORKFLOW_EDITOR, label: 'Workflows', icon: Box },
];

export function TemplateExplorerModal({ children }: { children?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Determine params based on selection
    const queryParams: any = { limit: 20 };
    if (selectedCategory === 'my-templates') {
        queryParams.mode = 'my-templates';
    } else if (selectedCategory !== 'all') {
        queryParams.type = selectedCategory;
    }

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteTemplates(queryParams);

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    // Flatten pages to get continuous list of templates
    const templates = data?.pages.flatMap((page) => page.data) || [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="text-[10px]">
                        Explore all
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh] p-0 gap-0 overflow-hidden flex">

                {/* Sidebar */}
                <div className="w-64 border-r border-border p-4 flex flex-col gap-2 shrink-0">
                    <h2 className="text-lg font-semibold px-4 mb-4">Templates</h2>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                                selectedCategory === cat.id
                                    ? "bg-accent text-accent-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* Header */}
                    <div className="h-16 border-b border-border flex items-center px-6 gap-4 shrink-0">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-10 rounded-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-4">
                                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                            </h3>

                            {status === 'pending' ? (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : status === 'error' ? (
                                <div className="h-40 flex items-center justify-center text-destructive">
                                    Error loading templates
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {templates.map((template) => (
                                        <TemplateCard key={template.id} template={template} />
                                    ))}
                                </div>
                            )}

                            {/* Load More Trigger */}
                            <div ref={ref} className="h-20 flex items-center justify-center mt-8">
                                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
