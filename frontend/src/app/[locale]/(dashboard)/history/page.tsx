'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import {
    FolderPlus, Film, LayoutGrid, Image as ImageIcon, Music, Mic, Video, Wand2,
    Download, Trash2, MoreHorizontal, Search, Loader2, Clock, Filter
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { get as apiGet, del as apiDel } from '@/lib/api';
import { toast } from 'sonner';
import { Generation } from '@/stores/generation-store';

type FilterType = 'all' | 'image' | 'video' | 'audio' | 'upscale';

const filterOptions: { id: FilterType; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'upscale', label: 'Upscale', icon: Wand2 },
];

function getTypeIcon(type: string) {
    if (type.includes('video')) return Video;
    if (type.includes('music') || type.includes('audio') || type.includes('sfx')) return Music;
    if (type.includes('voice')) return Mic;
    return ImageIcon;
}

function getStatusColor(status: string) {
    switch (status) {
        case 'completed': return 'text-green-500 bg-green-500/10';
        case 'processing': return 'text-blue-500 bg-blue-500/10';
        case 'pending': return 'text-yellow-500 bg-yellow-500/10';
        case 'failed': return 'text-red-500 bg-red-500/10';
        default: return 'text-muted-foreground bg-muted';
    }
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function groupByDate(items: Generation[]): { label: string; items: Generation[] }[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const groups: { label: string; items: Generation[] }[] = [
        { label: 'Today', items: [] },
        { label: 'This Week', items: [] },
        { label: 'This Month', items: [] },
        { label: 'Older', items: [] },
    ];

    items.forEach((item) => {
        const date = new Date(item.createdAt);
        if (date >= today) groups[0].items.push(item);
        else if (date >= weekAgo) groups[1].items.push(item);
        else if (date >= monthAgo) groups[2].items.push(item);
        else groups[3].items.push(item);
    });

    return groups.filter(g => g.items.length > 0);
}

export default function HistoryPage() {
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchHistory = useCallback(async (pageNum: number, reset = false) => {
      try {
        const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: '20',
            });
            if (filter !== 'all') params.set('type', filter);
            if (search.trim()) params.set('search', search);

            const data = await apiGet<{ data: Generation[]; hasNextPage: boolean }>(
                `/generations?${params.toString()}`
            );

            if (data?.data) {
                setGenerations(prev => reset ? data.data : [...prev, ...data.data]);
                setHasMore(data.hasNextPage ?? false);
        } else {
          // If API returns array directly
          const arr = Array.isArray(data) ? data : [];
          setGenerations(prev => reset ? arr : [...prev, ...arr]);
          setHasMore(arr.length >= 20);
        }
      } catch (error) {
        console.error('Failed to fetch history', error);
        // Show empty state on failure
        if (reset) setGenerations([]);
      }
      setIsLoading(false);
    }, [filter, search]);

    useEffect(() => {
        queueMicrotask(() => { void fetchHistory(1, true); });
    }, [filter, fetchHistory]);

    const handleDelete = async (id: string) => {
        try {
            await apiDel(`/generations/${id}`);
            setGenerations(prev => prev.filter(g => g.id !== id));
            toast.success('Generation deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleDownload = (url?: string) => {
        if (!url) return toast.error('No result available');
        window.open(url, '_blank');
    };

    const filteredGenerations = generations;
    const grouped = groupByDate(filteredGenerations);
    const dotColors = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4'];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-semibold">History</h1>
                        <span className="text-sm text-muted-foreground">
                            {generations.length} generation{generations.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search history..."
                                className="w-56 h-9 pl-10"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setPage(1);
                                        fetchHistory(1, true);
                                    }
                                }}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center bg-muted border border-border rounded-lg p-1">
                            {filterOptions.map((opt) => (
                                <Button
                                    key={opt.id}
                                    variant={filter === opt.id ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-7 text-xs gap-1.5"
                                    onClick={() => setFilter(opt.id)}
                                >
                                    <opt.icon className="w-3.5 h-3.5" />
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading && generations.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Clock className="w-12 h-12 text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground">No generations yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Your creation history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {grouped.map((group, gi) => (
                            <section key={group.label}>
                                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                    <div className={cn("w-2 h-2 rounded-full", dotColors[gi % dotColors.length])} />
                                    <span className="text-sm font-medium text-muted-foreground">{group.label}</span>
                                    <span className="text-xs text-muted-foreground/50">({group.items.length})</span>
                                </div>

                                <div className="space-y-3">
                                    {group.items.map((gen) => {
                                        const TypeIcon = getTypeIcon(gen.type);
                                        return (
                                            <div
                                                key={gen.id}
                                                className="h-24 bg-card hover:bg-accent border border-border hover:border-border/80 rounded-xl flex items-center p-4 gap-6 group cursor-pointer transition-all"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative w-32 h-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                    {gen.resultUrl ? (
                                                        <Image src={gen.resultUrl} alt="" fill className="object-cover" sizes="128px" />
                                                    ) : (
                                                        <TypeIcon className="w-6 h-6 text-muted-foreground/30" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider border border-border px-1.5 py-0.5 rounded">
                                                            {gen.type}
                                                        </span>
                                                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded", getStatusColor(gen.status))}>
                                                            {gen.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-base font-medium group-hover:text-primary transition-colors truncate">
                                                        {gen.prompt || `${gen.type} generation`}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {timeAgo(gen.createdAt)}
                                                        {gen.model && <span className="ml-2 opacity-50">• {gen.model}</span>}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {gen.resultUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => { e.stopPropagation(); handleDownload(gen.resultUrl); }}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(gen.id); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const next = page + 1;
                                        setPage(next);
                                        fetchHistory(next);
                                    }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
