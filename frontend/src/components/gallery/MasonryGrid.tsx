import { GalleryItem } from '@/types/gallery';
import { cn } from '@/lib/utils';
import { Heart, Download, Copy } from 'lucide-react';

export function MasonryGrid({ items, className }: { items: GalleryItem[], className?: string }) {
    return (
        <div className={cn("columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4", className)}>
            {items.map((item) => (
                <GalleryCard key={item.id} item={item} />
            ))}
        </div>
    );
}

function GalleryCard({ item }: { item: GalleryItem }) {
    return (
        <div className="break-inside-avoid relative group rounded-xl overflow-hidden bg-[#151619] mb-4">
            {/* Image */}
            <div className={cn("w-full relative", item.aspectRatio)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={item.url}
                    alt={item.prompt}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <p className="text-xs text-white/90 line-clamp-2 font-medium mb-3">{item.prompt}</p>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                            <span className="text-[10px] text-white/70">{item.author}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const event = new CustomEvent('gallery-like', { detail: { id: item.id }});
                                    window.dispatchEvent(event);
                                }}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors group/like relative"
                            >
                                <Heart className={`w-3.5 h-3.5 transition-colors ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/like:opacity-100 whitespace-nowrap">
                                    {item.likes > 0 ? `${item.likes} Likes` : 'Like'}
                                </span>
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(item.url);
                                    const event = new CustomEvent('gallery-copy', { detail: { id: item.id }});
                                    window.dispatchEvent(event);
                                }}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors group/copy relative"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover/copy:opacity-100 whitespace-nowrap">
                                    Copy URL
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
