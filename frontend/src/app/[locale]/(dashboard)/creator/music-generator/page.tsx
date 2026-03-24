'use client';

import { useState } from 'react';
import {
    ChevronDown,
    Upload,
    Sparkles,
    Grid3X3,
    Play,
    Music,
    Mic,
    Volume2,
    Loader2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

const controlTabs = ['Music', 'Sound Effects', 'Voice'];
const contentTabs = ['My Creations', 'Community', 'Templates', 'Tutorials'];

const genres = [
    { id: 'pop', name: 'Pop', icon: '🎵' },
    { id: 'rock', name: 'Rock', icon: '🎸' },
    { id: 'electronic', name: 'Electronic', icon: '🎧' },
    { id: 'classical', name: 'Classical', icon: '🎻' },
    { id: 'jazz', name: 'Jazz', icon: '🎷' },
    { id: 'ambient', name: 'Ambient', icon: '🌊' },
    { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
    { id: 'lofi', name: 'Lo-Fi', icon: '☕' },
];

const sampleTracks = [
    { id: '1', title: 'Upbeat Corporate', duration: '2:45', genre: 'Pop', waveform: '▁▃▅▇▅▃▁▃▅▇▅▃▁' },
    { id: '2', title: 'Epic Cinematic', duration: '3:20', genre: 'Cinematic', waveform: '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁' },
    { id: '3', title: 'Chill Lo-Fi Beat', duration: '2:10', genre: 'Lo-Fi', waveform: '▃▃▃▅▅▅▃▃▃▅▅▅▃▃' },
    { id: '4', title: 'Electronic Dance', duration: '3:05', genre: 'Electronic', waveform: '█▁█▁█▁█▁█▁█▁█▁█' },
];

export default function MusicGeneratorPage() {
    const [activeTab, setActiveTab] = useState('Music');
    const [activeContentTab, setActiveContentTab] = useState('Templates');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState('30');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 3000));
        setIsGenerating(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Left Control Panel */}
            <div className="w-80 border-r border-border flex flex-col shrink-0">
                {/* Tabs */}
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Music Generator</h2>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates */}
                    <button className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Music className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">Browse presets</span>
                        </div>
                        <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Genre Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Genre</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    onClick={() => setSelectedGenre(genre.id)}
                                    className={cn(
                                        "p-2 rounded-lg flex flex-col items-center gap-1 text-xs transition-all",
                                        selectedGenre === genre.id
                                            ? "bg-accent border border-border text-foreground"
                                            : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/50"
                                    )}
                                >
                                    <span className="text-lg">{genre.icon}</span>
                                    <span className="truncate w-full text-center">{genre.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Duration</h4>
                        <div className="flex items-center gap-2">
                            {['15', '30', '60', '120'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                        duration === d
                                            ? "bg-accent text-accent-foreground border border-border"
                                            : "bg-card text-muted-foreground border border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the music you want to create... e.g., 'Upbeat energetic music for a workout video with strong drums and synths'"
                                className="w-full h-32 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    {/* Reference Upload */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reference Track (Optional)</h4>
                        <div className="w-full aspect-[3/1] rounded-lg bg-muted border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                                <Upload className="w-6 h-6" />
                                <span className="text-xs">Drop audio file or click to upload</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full h-12 font-semibold rounded-xl gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Music
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto bg-background">
                {/* Content Header */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-6 h-14 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-1">
                        {contentTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveContentTab(tab)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                    activeContentTab === tab
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Recent Generations */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Sample Tracks</h3>
                        <div className="space-y-3">
                            {sampleTracks.map((track) => (
                                <div
                                    key={track.id}
                                    className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group cursor-pointer"
                                >
                                    <button className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors">
                                        <Play className="w-5 h-5 text-muted-foreground fill-muted-foreground" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium truncate">{track.title}</h4>
                                        <p className="text-xs text-muted-foreground">{track.genre} • {track.duration}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-1 text-muted-foreground/60 text-lg font-mono">
                                        {track.waveform}
                                    </div>
                                    <Volume2 className="w-5 h-5 text-muted-foreground/50" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Getting Started - No gradients, neutral cards */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-6 bg-card rounded-2xl border border-border">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                    <Mic className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold mb-2">Voice Cloning</h4>
                                <p className="text-sm text-muted-foreground">Clone any voice and use it in your projects</p>
                            </div>
                            <div className="p-6 bg-card rounded-2xl border border-border">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                    <Music className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold mb-2">Custom Soundtracks</h4>
                                <p className="text-sm text-muted-foreground">Generate unique music for videos and games</p>
                            </div>
                            <div className="p-6 bg-card rounded-2xl border border-border">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                    <Volume2 className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold mb-2">Sound Effects</h4>
                                <p className="text-sm text-muted-foreground">Create custom sound effects from text</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
