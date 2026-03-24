'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    ChevronDown,
    Upload,
    Sparkles,
    Grid3X3,
    Play,
    Pause,
    Music,
    Mic,
    Volume2,
    Loader2,
    Download,
    Folder,
    Clock,
    Sliders
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

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
    { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
    { id: 'rnb', name: 'R&B', icon: '💜' },
    { id: 'country', name: 'Country', icon: '🤠' },
    { id: 'reggae', name: 'Reggae', icon: '🌴' },
];

const moods = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
    { id: 'energetic', label: 'Energetic', emoji: '⚡' },
    { id: 'calm', label: 'Calm', emoji: '🧘' },
    { id: 'dark', label: 'Dark', emoji: '🌑' },
    { id: 'uplifting', label: 'Uplifting', emoji: '🌟' },
    { id: 'romantic', label: 'Romantic', emoji: '💕' },
    { id: 'epic', label: 'Epic', emoji: '🏔️' },
];

const instruments = [
    { id: 'piano', label: 'Piano' },
    { id: 'guitar', label: 'Guitar' },
    { id: 'drums', label: 'Drums' },
    { id: 'synth', label: 'Synth' },
    { id: 'strings', label: 'Strings' },
    { id: 'bass', label: 'Bass' },
    { id: 'flute', label: 'Flute' },
    { id: 'brass', label: 'Brass' },
];

const sampleTracks = [
    { id: '1', title: 'Upbeat Corporate', duration: '2:45', genre: 'Pop', bpm: 120, time: '2 min ago' },
    { id: '2', title: 'Epic Cinematic Score', duration: '3:20', genre: 'Cinematic', bpm: 90, time: '5 min ago' },
    { id: '3', title: 'Chill Lo-Fi Beat', duration: '2:10', genre: 'Lo-Fi', bpm: 75, time: '10 min ago' },
    { id: '4', title: 'Electronic Dance', duration: '3:05', genre: 'Electronic', bpm: 128, time: '15 min ago' },
];

export default function MusicGeneratorPage() {
    const [activeContentTab, setActiveContentTab] = useState('Templates');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState('30');
    const [tempo, setTempo] = useState(120);
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const [referenceFile, setReferenceFile] = useState<string | null>(null);
    const { generateMusic, isGenerating, currentGeneration, error } = useGenerationStore();

    const toggleMood = (id: string) => {
        setSelectedMoods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const toggleInstrument = (id: string) => {
        setSelectedInstruments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        await generateMusic({
            prompt,
            genre: selectedGenre || undefined,
            moods: selectedMoods.length > 0 ? selectedMoods : undefined,
            instruments: selectedInstruments.length > 0 ? selectedInstruments : undefined,
            duration: parseInt(duration),
            tempo,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Music Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Presets */}
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
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Genre</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                                    className={cn(
                                        "p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] transition-all border",
                                        selectedGenre === genre.id
                                            ? "bg-accent border-primary/20 text-foreground"
                                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                                    )}
                                >
                                    <span className="text-base">{genre.icon}</span>
                                    <span className="truncate w-full text-center">{genre.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Mood</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {moods.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => toggleMood(mood.id)}
                                    className={cn(
                                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                        selectedMoods.includes(mood.id)
                                            ? "bg-accent border border-primary/20 text-foreground"
                                            : "bg-card border border-border text-muted-foreground"
                                    )}
                                >
                                    <span>{mood.emoji}</span>
                                    <span>{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instruments */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Instruments</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {instruments.map((inst) => (
                                <button
                                    key={inst.id}
                                    onClick={() => toggleInstrument(inst.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                        selectedInstruments.includes(inst.id)
                                            ? "bg-accent border border-primary/20 text-foreground"
                                            : "bg-card border border-border text-muted-foreground"
                                    )}
                                >
                                    {inst.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Duration</h4>
                        <div className="flex items-center gap-1.5">
                            {['15', '30', '60', '120', '180'].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-[10px] font-medium transition-all",
                                        duration === d
                                            ? "bg-accent border border-primary/20 text-foreground"
                                            : "bg-card border border-border text-muted-foreground"
                                    )}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tempo */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Tempo</Label>
                            <span className="text-[11px] font-mono text-foreground">{tempo} BPM</span>
                        </div>
                        <Slider min={60} max={200} step={5} value={[tempo]} onValueChange={([v]) => setTempo(v)} />
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Description</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the music you want to create... e.g., 'Upbeat energetic music for a workout video with strong drums and synths'"
                                className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    {/* Reference Track */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Reference (Optional)</h4>
                        <div className="w-full aspect-[4/1] rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2">
                            <Upload className="w-5 h-5 text-muted-foreground/50" />
                            <span className="text-xs text-muted-foreground">Drop audio or click</span>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{parseInt(duration) <= 30 ? '2' : parseInt(duration) <= 60 ? '4' : '8'} Credits</span>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full h-12 font-bold rounded-xl gap-2"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Composing...</>
                        ) : (
                            <><Music className="w-5 h-5" /> Generate Music</>
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
                                    "px-4 py-2 text-sm font-medium rounded-full transition-colors",
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

                <div className="p-6 space-y-8">
                    {/* Generated / Sample Tracks */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">
                            {isGenerating ? 'Composing...' : 'Sample Tracks'}
                        </h3>
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                    <Music className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-sm text-muted-foreground animate-pulse">AI is composing your track...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sampleTracks.map((track) => (
                                    <div
                                        key={track.id}
                                        className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group cursor-pointer"
                                    >
                                        <button
                                            onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                                            className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors shrink-0"
                                        >
                                            {playingTrackId === track.id ? (
                                                <Pause className="w-5 h-5" />
                                            ) : (
                                                <Play className="w-5 h-5 fill-current" />
                                            )}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{track.title}</h4>
                                            <p className="text-xs text-muted-foreground">{track.genre} • {track.duration} • {track.bpm} BPM</p>
                                        </div>
                                        {/* Waveform */}
                                        <div className="hidden md:flex items-center gap-[2px] h-8 flex-1 max-w-[300px]">
                                            {Array.from({ length: 50 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-[2px] rounded-full transition-colors",
                                                        playingTrackId === track.id ? "bg-primary" : "bg-muted-foreground/20"
                                                    )}
                                                    style={{ height: `${Math.sin(i * 0.3) * 12 + 16}px` }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>{track.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="outline" size="icon" className="w-8 h-8"><Folder className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="icon" className="w-8 h-8"><Download className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Getting Started */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                    <Mic className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold mb-2">Voice Cloning</h4>
                                <p className="text-sm text-muted-foreground">Clone any voice and use it in your projects</p>
                            </div>
                            <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                    <Music className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-semibold mb-2">Custom Soundtracks</h4>
                                <p className="text-sm text-muted-foreground">Generate unique music for videos and games</p>
                            </div>
                            <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
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
