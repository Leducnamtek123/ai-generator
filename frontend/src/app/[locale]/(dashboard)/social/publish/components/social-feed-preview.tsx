'use client';

import Image from 'next/image';
import React from 'react';
import {
    Bookmark,
    CheckCircle2,
    Facebook,
    Globe,
    Heart,
    Instagram,
    MessageSquare,
    MoreHorizontal,
    Repeat2,
    Send,
    Share2,
    Twitter,
} from 'lucide-react';

interface PreviewProps {
    platform: string;
    content: string;
    mediaUrls?: string[];
}

const EMPTY_MEDIA_URLS: string[] = [];

export function SocialFeedPreview({ platform, content, mediaUrls }: PreviewProps) {
    const safeMediaUrls = mediaUrls?.length ? mediaUrls : EMPTY_MEDIA_URLS;

    if (platform === 'facebook') return <FacebookPreview content={content} mediaUrls={safeMediaUrls} />;
    if (platform === 'twitter') return <TwitterPreview content={content} mediaUrls={safeMediaUrls} />;
    if (platform === 'instagram') return <InstagramPreview content={content} mediaUrls={safeMediaUrls} />;
    
    return (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl uppercase tracking-widest font-bold text-xs opacity-50">
            Preview not available for {platform}
        </div>
    );
}

function FacebookPreview({ content, mediaUrls }: { content: string; mediaUrls: string[] }) {
    return (
        <div className="w-full max-w-lg bg-[#242526] text-[#E4E6EB] rounded-xl shadow-2xl overflow-hidden font-sans">
            <div className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                    <Facebook className="w-6 h-6 fill-current" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-sm hover:underline cursor-pointer">PaintAI Design Studio</span>
                        <CheckCircle2 className="w-3.5 h-3.5 fill-blue-500 text-[#242526]" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#B0B3B8]">
                        <span>Just now</span>
                        <span>•</span>
                        <Globe className="w-3 h-3" />
                    </div>
                </div>
                <MoreHorizontal className="w-5 h-5 text-[#B0B3B8] cursor-pointer" />
            </div>
            
            <div className="px-4 pb-4 text-[15px] leading-relaxed">
                {content || <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />}
            </div>

            {mediaUrls.length > 0 ? (
                <div className="relative w-full aspect-video bg-slate-900/30 overflow-hidden border-y border-white/5">
                    <Image src={mediaUrls[0]} alt="Post media" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                </div>
            ) : (
                <div className="w-full h-64 bg-white/5 flex items-center justify-center border-y border-white/5 text-xs text-white/20 italic">
                    Media Space
                </div>
            )}

            <div className="p-3 border-t border-white/5 flex items-center justify-around text-sm font-semibold text-[#B0B3B8]">
                <div className="flex items-center gap-2 hover:bg-white/10 px-6 py-1.5 rounded-md cursor-pointer flex-1 justify-center transition-colors">
                    <Heart className="w-5 h-5" /> Like
                </div>
                <div className="flex items-center gap-2 hover:bg-white/10 px-6 py-1.5 rounded-md cursor-pointer flex-1 justify-center transition-colors">
                    <MessageSquare className="w-5 h-5" /> Comment
                </div>
                <div className="flex items-center gap-2 hover:bg-white/10 px-6 py-1.5 rounded-md cursor-pointer flex-1 justify-center transition-colors">
                    <Share2 className="w-5 h-5" /> Share
                </div>
            </div>
        </div>
    );
}

function TwitterPreview({ content, mediaUrls }: { content: string; mediaUrls: string[] }) {
    return (
        <div className="w-full max-w-lg bg-slate-950 border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-4 font-sans text-white">
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/10 shrink-0">
                    <Twitter className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                            <span className="font-bold text-sm">PaintAI</span>
                            <CheckCircle2 className="w-4 h-4 fill-primary text-black" />
                            <span className="text-[#71767B] text-sm">@paintai_app • now</span>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-[#71767B]" />
                    </div>
                    
                    <div className="mt-1 text-[15px] leading-normal whitespace-pre-wrap">
                        {content || <div className="space-y-2 mt-2"><div className="h-3 w-full bg-white/10 rounded" /><div className="h-3 w-2/3 bg-white/10 rounded" /></div>}
                    </div>

                    {mediaUrls.length > 0 && (
                        <div className="relative mt-3 rounded-2xl overflow-hidden border border-white/10 aspect-video">
                            <Image src={mediaUrls[0]} alt="Post media" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[#71767B] max-w-sm">
                        <MessageSquare className="w-4 h-4 hover:text-blue-400 cursor-pointer" />
                        <Repeat2 className="w-4 h-4 hover:text-green-400 cursor-pointer" />
                        <Heart className="w-4 h-4 hover:text-pink-400 cursor-pointer" />
                        <Share2 className="w-4 h-4 hover:text-primary cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function InstagramPreview({ content, mediaUrls }: { content: string; mediaUrls: string[] }) {
    return (
        <div className="w-full max-w-md bg-white text-black rounded-lg shadow-2xl overflow-hidden font-sans border border-gray-200">
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                                <Instagram className="w-4 h-4 text-black" />
                            </div>
                        </div>
                    </div>
                    <span className="text-sm font-semibold">paintai_studio</span>
                </div>
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </div>

            <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden border-y border-gray-100">
                {mediaUrls.length > 0 ? (
                    <Image src={mediaUrls[0]} alt="Post media" fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" />
                ) : (
                    <Instagram className="w-20 h-20 text-gray-200" />
                )}
            </div>

            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart className="w-6 h-6 hover:text-red-500 cursor-pointer transition-colors" />
                        <MessageSquare className="w-6 h-6 hover:opacity-70 cursor-pointer" />
                        <Send className="w-6 h-6 hover:opacity-70 cursor-pointer" />
                    </div>
                    <Bookmark className="w-6 h-6 hover:opacity-70 cursor-pointer" />
                </div>
                
                <div className="space-y-1">
                    <p className="text-sm font-bold">1,024 likes</p>
                    <p className="text-sm leading-snug">
                        <span className="font-bold mr-2">paintai_studio</span>
                        {content || "Generating creative caption..." }
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1 font-medium">Just now</p>
                </div>
            </div>
        </div>
    );
}
