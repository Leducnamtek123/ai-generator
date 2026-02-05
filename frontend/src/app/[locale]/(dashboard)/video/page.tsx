'use client';

import { useState } from 'react';
import {
    ChevronDown,
    Plus,
    Upload,
    Sparkles,
    Grid3X3,
    Search,
    ArrowRight,
    Play,
    Globe,
    LayoutGrid,
    Video,
    Image as ImageIcon,
    Mic,
    Settings
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

// Control tabs
const controlTabs = ['Image', 'Video', 'Audio', 'Tools'];
const contentTabs = ['Personal', 'Community', 'Templates', 'Tutorials'];

// Tutorial videos
const tutorials = [
    {
        id: 't1',
        title: 'Generate a video',
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
        type: 'tutorial'
    },
    {
        id: 't2',
        title: 'Generate an image',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop',
        type: 'tutorial'
    },
];

// More tutorials
const moreTutorials = [
    { id: 'm1', title: 'Create mockups with Nano Banana', duration: '01:15', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop' },
    { id: 'm2', title: 'Make products in realistic Contexts', duration: '00:56', thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop' },
    { id: 'm3', title: 'How to create cinematic videos', duration: '02:25', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=200&fit=crop' },
    { id: 'm4', title: 'Make consistent characters from one', duration: '01:40', thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=200&fit=crop' },
];

export default function VideoPage() {
    const [activeTab, setActiveTab] = useState('Video');
    const [activeContentTab, setActiveContentTab] = useState('Tutorials');
    const [selectedModel, setSelectedModel] = useState('Auto');
    const [promptMode, setPromptMode] = useState<'Text' | 'Visual'>('Text');

    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex">
            {/* Left Control Panel */}
            <div className="w-72 border-r border-white/5 flex flex-col shrink-0">
                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {controlTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab
                                    ? "text-white border-white"
                                    : "text-white/40 border-transparent hover:text-white/60"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates Button */}
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Grid3X3 className="w-5 h-5" />
                        <span>Browse templates</span>
                    </button>

                    {/* MODEL */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Model</h4>
                        <button className="flex items-center justify-between w-full px-4 py-3 bg-[#151619] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-white/60" />
                                <span className="text-sm">{selectedModel}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                    </div>

                    {/* REFERENCES */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">References</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Start Image */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full aspect-square rounded-lg bg-[#151619] border border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-white/20 transition-colors">
                                    <Upload className="w-6 h-6 text-white/30" />
                                </div>
                                <span className="text-[10px] text-white/40">Start image</span>
                            </div>
                            {/* End Image */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full aspect-square rounded-lg bg-[#151619] border border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-white/20 transition-colors">
                                    <Upload className="w-6 h-6 text-white/30" />
                                </div>
                                <span className="text-[10px] text-white/40">End image</span>
                            </div>
                        </div>
                    </div>

                    {/* PROMPT */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Prompt</h4>
                            <div className="flex items-center gap-1 bg-[#151619] rounded-lg p-0.5">
                                <button
                                    onClick={() => setPromptMode('Text')}
                                    className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors",
                                        promptMode === 'Text' ? "bg-white/10 text-white" : "text-white/40"
                                    )}
                                >
                                    Text
                                </button>
                                <button
                                    onClick={() => setPromptMode('Visual')}
                                    className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors",
                                        promptMode === 'Visual' ? "bg-white/10 text-white" : "text-white/40"
                                    )}
                                >
                                    Visual
                                </button>
                            </div>
                        </div>

                        <textarea
                            placeholder="Describe your video"
                            className="w-full h-24 px-4 py-3 bg-[#151619] border border-white/5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
                        />
                    </div>

                    {/* Settings Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151619] border border-white/5 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/10 transition-colors">
                            <span>5-8"</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151619] border border-white/5 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/10 transition-colors">
                            <span>16:9</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151619] border border-white/5 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/10 transition-colors">
                            <Sparkles className="w-3 h-3" />
                            <span>OFF</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151619] border border-white/5 rounded-lg text-xs text-white/60 hover:text-white hover:border-white/10 transition-colors">
                            <Settings className="w-3 h-3" />
                            <span>OFF</span>
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-white/5">
                    <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl gap-2">
                        <Sparkles className="w-4 h-4" />
                        Upgrade
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto">
                {/* Content Header */}
                <div className="sticky top-0 z-10 bg-[#0B0C0E] border-b border-white/5 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {contentTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveContentTab(tab)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                    activeContentTab === tab
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                {tab === 'Personal' && <ChevronDown className="w-3 h-3" />}
                                {tab === 'Community' && <Globe className="w-4 h-4" />}
                                {tab === 'Templates' && <LayoutGrid className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Getting Started - Large Tutorial Cards */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Getting started</h3>
                        <div className="grid grid-cols-2 gap-6">
                            {tutorials.map((tutorial) => (
                                <div key={tutorial.id} className="group cursor-pointer relative rounded-2xl overflow-hidden">
                                    <div className="aspect-[16/9] relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={tutorial.thumbnail}
                                            alt={tutorial.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                        {/* Play Button */}
                                        <div className="absolute bottom-6 left-6">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </div>
                                        </div>

                                        {/* Text */}
                                        <div className="absolute bottom-6 left-20">
                                            <p className="text-xs text-white/60 mb-1">Tutorials</p>
                                            <h4 className="text-xl font-semibold text-white">{tutorial.title}</h4>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* More Tutorials */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">More tutorials</h3>
                            <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                                Featured
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {moreTutorials.map((tutorial) => (
                                <div key={tutorial.id} className="group cursor-pointer">
                                    <div className="aspect-video rounded-xl overflow-hidden relative bg-[#151619]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={tutorial.thumbnail}
                                            alt={tutorial.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Play className="w-5 h-5 text-white fill-white" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                                            {tutorial.duration}
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-white/60 group-hover:text-white transition-colors line-clamp-2">
                                        {tutorial.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
