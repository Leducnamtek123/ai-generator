'use client';

import React, { useState, useEffect } from 'react';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { MasonryGridSkeleton } from '@/components/common/loading-skeletons';
import { useAssets } from '@/hooks/useAssets';
import { Asset } from '@/lib/api/assets';
import { GalleryItem } from '@/types/gallery';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const GALLERY_FILTERS = [
    'Popular',
    'Image',
    'Video',
    'Styles',
    'Creators',
] as const;

const STYLE_CATEGORIES = new Set(['ai images', 'vectors', '3d']);

const toCommunityAssetUrl = (value: string) => {
    if (!value) return '';

    try {
        const url = new URL(value);

        if (url.pathname.startsWith('/api/v1/')) {
            return `${url.pathname}${url.search}${url.hash}`;
        }

        if (url.pathname.startsWith('/files/')) {
            return `/api/v1${url.pathname}${url.search}${url.hash}`;
        }

        return value;
    } catch {
        const normalized = value.startsWith('/') ? value : `/${value}`;

        if (normalized.startsWith('/api/v1/')) {
            return normalized;
        }

        if (normalized.startsWith('/files/')) {
            return `/api/v1${normalized}`;
        }

        return normalized;
    }
};

export function InspirationGallery() {
    const { assets, isLoading } = useAssets({ limit: 20, mode: 'public' });
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [activeFilter, setActiveFilter] = useState<(typeof GALLERY_FILTERS)[number]>('Popular');
    const artRatios = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-[1/1]', 'aspect-[6/7]'];

    useEffect(() => {
        const handleLike = (event: Event) => {
            const e = event as CustomEvent<{ id: string }>;
            const id = e.detail.id;
            setLikedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
        };

        const handleCopy = () => {
            toast.success('Link copied to clipboard!');
        };

        window.addEventListener('gallery-like', handleLike);
        window.addEventListener('gallery-copy', handleCopy);
        
        return () => {
            window.removeEventListener('gallery-like', handleLike);
            window.removeEventListener('gallery-copy', handleCopy);
        };
    }, []);

    // Map Backend Asset to Frontend GalleryItem
    const galleryItems = assets.map((asset, index): GalleryItem & { type: Asset['type']; category: string } => {
        const isLiked = likedIds.has(asset.id);
        const baseLikes = asset.metadata?.likes || 0;
        const category = typeof asset.metadata?.category === 'string' ? asset.metadata.category : '';
        
        return {
            id: asset.id,
            url: toCommunityAssetUrl(asset.url),
            prompt: asset.metadata?.prompt || 'No prompt',
            author: asset.metadata?.authorName || 'Unknown',
            likes: isLiked ? baseLikes + 1 : baseLikes,
            isLiked,
            aspectRatio: asset.metadata?.aspectRatio || artRatios[index % artRatios.length],
            type: asset.type,
            category,
        };
    });

    const filteredGalleryItems = (() => {
        const normalizedCategory = (value: string) => value.trim().toLowerCase();

        const byFilter = {
            Popular: [...galleryItems].sort((a, b) => b.likes - a.likes),
            Image: galleryItems.filter((item) => item.type === 'image').sort((a, b) => b.likes - a.likes),
            Video: galleryItems
                .filter((item) => item.type === 'video')
                .sort((a, b) => b.likes - a.likes),
            Styles: galleryItems
                .filter((item) => {
                    const category = normalizedCategory(item.category);
                    return STYLE_CATEGORIES.has(category) || item.prompt.toLowerCase().includes('style');
                })
                .sort((a, b) => b.likes - a.likes),
            Creators: [...galleryItems].sort((a, b) => a.author.localeCompare(b.author)),
        } satisfies Record<(typeof GALLERY_FILTERS)[number], GalleryItem[]>;

        return byFilter[activeFilter];
    })();

    if (isLoading) {
        return <MasonryGridSkeleton count={8} />;
    }

    if (filteredGalleryItems.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                No inspiration found. Check back later!
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {GALLERY_FILTERS.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                            'rounded-full px-4 py-2 text-sm transition-all',
                            activeFilter === filter
                                ? 'bg-white text-black shadow-sm'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <MasonryGrid items={filteredGalleryItems} />
        </div>
    );
}
