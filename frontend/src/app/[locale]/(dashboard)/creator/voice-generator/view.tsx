'use client';

import React from 'react';
import {
    Volume2,
    Upload,
    Download,
    Loader2,
    Play,
    User,
    Languages,
    Smile,
    Frown,
    Angry,
    Meh,
    MicVocal,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import type { VoiceGeneratorState, VoiceGeneratorAction } from './page';
import { Sparkles } from 'lucide-react';

const voices = [
    { id: 'aria', name: 'Aria', gender: 'Female', accent: 'American', tags: ['Natural', 'Warm'] },
    { id: 'james', name: 'James', gender: 'Male', accent: 'British', tags: ['Deep', 'Authoritative'] },
    { id: 'luna', name: 'Luna', gender: 'Female', accent: 'American', tags: ['Soft', 'Soothing'] },
    { id: 'marcus', name: 'Marcus', gender: 'Male', accent: 'American', tags: ['Energetic', 'Casual'] },
    { id: 'yuki', name: 'Yuki', gender: 'Female', accent: 'Japanese', tags: ['Cute', 'Expressive'] },
    { id: 'hans', name: 'Hans', gender: 'Male', accent: 'German', tags: ['Clear', 'Professional'] },
    { id: 'sofia', name: 'Sofia', gender: 'Female', accent: 'Spanish', tags: ['Warm', 'Melodic'] },
    { id: 'david', name: 'David', gender: 'Male', accent: 'Australian', tags: ['Friendly', 'Casual'] },
];

const languages = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Spanish' },
    { id: 'fr', label: 'French' },
    { id: 'de', label: 'German' },
    { id: 'ja', label: 'Japanese' },
    { id: 'ko', label: 'Korean' },
    { id: 'zh', label: 'Chinese' },
    { id: 'vi', label: 'Vietnamese' },
];

const emotions = [
    { id: 'neutral', label: 'Neutral', icon: Meh },
    { id: 'happy', label: 'Happy', icon: Smile },
    { id: 'sad', label: 'Sad', icon: Frown },
    { id: 'excited', label: 'Excited', icon: Sparkles },
    { id: 'angry', label: 'Angry', icon: Angry },
    { id: 'whispering', label: 'Whisper', icon: MicVocal },
];

const generatedAudios = [
    { id: '1', text: 'Welcome to our new product launch...', voice: 'Aria', duration: '0:15', time: '2 min ago' },
    { id: '2', text: 'In this tutorial, we will explore...', voice: 'James', duration: '0:32', time: '5 min ago' },
    { id: '3', text: 'Good morning everyone, today...', voice: 'Luna', duration: '0:08', time: '10 min ago' },
];

type Props = {
    state: VoiceGeneratorState;
    dispatch: React.Dispatch<VoiceGeneratorAction>;
    onGenerate: () => void;
};

export function VoiceGeneratorView({ state, dispatch, onGenerate }: Props) {
    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[340px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Voice Generator</h2>
                </div>
                <div className="px-4 pt-4">
                    <div className="grid grid-cols-2 p-1 bg-muted rounded-xl border border-border">
                        <button
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: 'tts' })}
                            className={cn(
                                'py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all',
                                state.activeTab === 'tts'
                                    ? 'bg-background text-foreground shadow-lg border border-border'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Text to Speech
                        </button>
                        <button
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: 'clone' })}
                            className={cn(
                                'py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all',
                                state.activeTab === 'clone'
                                    ? 'bg-background text-foreground shadow-lg border border-border'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Voice Clone
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {state.activeTab === 'tts' ? (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Text</h4>
                                    <span className="text-[10px] text-muted-foreground">{state.text.length}/5000</span>
                                </div>
                                <div className="bg-card rounded-xl border border-border p-2">
                                    <textarea
                                        value={state.text}
                                        onChange={(e) => dispatch({ type: 'setText', text: e.target.value })}
                                        placeholder="Enter the text you want to convert to speech..."
                                        className="w-full h-32 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                                        maxLength={5000}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Language</h4>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.id}
                                            onClick={() => dispatch({ type: 'setSelectedLanguage', selectedLanguage: lang.id })}
                                            className={cn(
                                                'flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all',
                                                state.selectedLanguage === lang.id
                                                    ? 'bg-accent border border-primary/20 text-foreground'
                                                    : 'bg-card border border-border text-muted-foreground hover:border-border/80',
                                            )}
                                        >
                                            <Languages className="w-4 h-4" />
                                            <span className="truncate w-full text-center">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Voice</h4>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                    {voices.map((voice) => (
                                        <button
                                            key={voice.id}
                                            onClick={() => dispatch({ type: 'setSelectedVoice', selectedVoice: voice.id })}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                                                state.selectedVoice === voice.id
                                                    ? 'bg-accent border-primary/20'
                                                    : 'bg-card border-border hover:border-border/80',
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium">{voice.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{voice.gender} • {voice.accent}</p>
                                            </div>
                                            <button className="w-6 h-6 rounded-full bg-muted hover:bg-accent flex items-center justify-center shrink-0">
                                                <Play className="w-3 h-3 fill-current" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Emotion</h4>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {emotions.map((em) => (
                                        <button
                                            key={em.id}
                                            onClick={() => dispatch({ type: 'setSelectedEmotion', selectedEmotion: em.id })}
                                            className={cn(
                                                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all',
                                                state.selectedEmotion === em.id
                                                    ? 'bg-accent border border-primary/20 text-foreground'
                                                    : 'bg-card border border-border text-muted-foreground',
                                            )}
                                        >
                                            <em.icon className="w-3.5 h-3.5" />
                                            <span>{em.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Speed</Label>
                                        <span className="text-[11px] font-mono text-foreground">{state.speed}%</span>
                                    </div>
                                    <Slider min={50} max={200} step={5} value={[state.speed]} onValueChange={([v]) => dispatch({ type: 'setSpeed', speed: v })} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Pitch</Label>
                                        <span className="text-[11px] font-mono text-foreground">{state.pitch}</span>
                                    </div>
                                    <Slider min={-20} max={20} step={1} value={[state.pitch]} onValueChange={([v]) => dispatch({ type: 'setPitch', pitch: v })} />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Stability</Label>
                                        <span className="text-[11px] font-mono text-foreground">{state.stability}%</span>
                                    </div>
                                    <Slider min={0} max={100} step={5} value={[state.stability]} onValueChange={([v]) => dispatch({ type: 'setStability', stability: v })} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="aspect-[3/1] rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground/50" />
                                <div className="text-center">
                                    <p className="text-xs font-medium">Upload Voice Sample</p>
                                    <p className="text-[10px] text-muted-foreground">MP3, WAV, 10s-5min</p>
                                </div>
                            </div>
                            <div className="p-4 bg-card rounded-xl border border-border space-y-2">
                                <p className="text-xs font-medium">Tips for best results:</p>
                                <ul className="text-[10px] text-muted-foreground space-y-1">
                                    <li>• Use clear audio without background noise</li>
                                    <li>• Recording should be at least 30 seconds</li>
                                    <li>• Include varied speech with natural pauses</li>
                                    <li>• Speak clearly and at a natural pace</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">1 Credit / 1000 chars</span>
                    </div>
                    <Button
                        onClick={onGenerate}
                        disabled={state.isGenerating || !state.text.trim()}
                        className="w-full h-12 font-bold rounded-xl gap-2"
                    >
                        {state.isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-5 h-5" />
                                Generate Voice
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        {(['history', 'voices'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setContentTab', contentTab: tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors capitalize',
                                    state.contentTab === tab
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab === 'history' ? 'My Generations' : 'Voice Library'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {state.contentTab === 'history' ? (
                        generatedAudios.length > 0 ? (
                            generatedAudios.map((audio) => (
                                <div key={audio.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group">
                                    <button className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0">
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{audio.text}</p>
                                        <p className="text-xs text-muted-foreground">{audio.voice} • {audio.duration} • {audio.time}</p>
                                    </div>
                                    <div className="hidden lg:flex items-center gap-[2px] h-8">
                                        {Array.from({ length: 30 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-[3px] bg-muted-foreground/20 rounded-full"
                                                style={{ height: `${Math.random() * 24 + 8}px` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="icon" className="w-8 h-8">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                    <Volume2 className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No generations yet</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Enter text and generate your first voice</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {voices.map((voice) => (
                                <div key={voice.id} className="p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{voice.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{voice.gender} • {voice.accent}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {voice.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">{tag}</span>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                        <Play className="w-3 h-3 fill-current" />
                                        Preview
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
