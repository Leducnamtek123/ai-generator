'use client';

import React from 'react';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { useAssets } from '@/hooks/useAssets';
import { GalleryItem } from '@/types/gallery';
import { Loader2 } from 'lucide-react';

export function InspirationGallery() {
    const { assets, isLoading } = useAssets({ limit: 20, mode: 'public' });

    // Map Backend Asset to Frontend GalleryItem
    const galleryItems: GalleryItem[] = assets.map(asset => ({
        id: asset.id,
        url: asset.url,
        prompt: asset.metadata?.prompt || 'No prompt',
        author: asset.metadata?.authorName || 'Unknown',
        likes: asset.metadata?.likes || 0,
        aspectRatio: asset.metadata?.aspectRatio || 'aspect-[1/1]', // Default aspect ratio if missing
    }));

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
            </div>
        );
    }

    if (galleryItems.length === 0) {
        return (
            <div className="text-center py-12 text-white/40">
                No inspiration found. Check back later!
            </div>
        );
    }

    return <MasonryGrid items={galleryItems} />;
}
