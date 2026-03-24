'use client';

import React, { useState, useEffect } from 'react';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { useAssets } from '@/hooks/useAssets';
import { GalleryItem } from '@/types/gallery';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function InspirationGallery() {
    const { assets, isLoading } = useAssets({ limit: 20, mode: 'public' });
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const handleLike = (e: any) => {
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
    const galleryItems: GalleryItem[] = assets.map(asset => {
        const isLiked = likedIds.has(asset.id);
        const baseLikes = asset.metadata?.likes || 0;
        
        return {
            id: asset.id,
            url: asset.url,
            prompt: asset.metadata?.prompt || 'No prompt',
            author: asset.metadata?.authorName || 'Unknown',
            likes: isLiked ? baseLikes + 1 : baseLikes,
            isLiked,
            aspectRatio: asset.metadata?.aspectRatio || 'aspect-[1/1]', // Default aspect ratio if missing
        };
    });

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
