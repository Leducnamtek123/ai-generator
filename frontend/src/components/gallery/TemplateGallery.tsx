'use client';

import React from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { TemplateCard } from './TemplateCard';

interface TemplateGalleryProps {
    hidePagination?: boolean;
}

export function TemplateGallery({ hidePagination = false }: TemplateGalleryProps) {
    const { templates, isLoading, error, hasNextPage, setPage } = useTemplates({ limit: 12 });
    const [currentPage, setCurrentPage] = React.useState(1);

    const handleNextPage = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        setPage(nextPage);
    };

    const handlePrevPage = () => {
        const prevPage = Math.max(1, currentPage - 1);
        setCurrentPage(prevPage);
        setPage(prevPage);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-destructive">
                Error loading templates: {error}
            </div>
        );
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No templates found. Check back later!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                ))}
            </div>

            {/* Pagination */}
            {!hidePagination && (currentPage > 1 || hasNextPage) && (
                <div className="flex items-center justify-center gap-4 pt-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
