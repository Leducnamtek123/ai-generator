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
    Sparkles,
    Search,
    Pause,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import type { VoiceGeneratorState, VoiceGeneratorAction } from './page';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';

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

type Props = {
    state: VoiceGeneratorState;
    dispatch: React.Dispatch<VoiceGeneratorAction>;
    onGenerate: () => void;
    isGenerating: boolean;
    generations: any[];
    isGenerationsLoading: boolean;
    templates: any[];
    isTemplatesLoading: boolean;
    communityListings: any[];
    isCommunityLoading: boolean;
};

export function VoiceGeneratorView({ 
    state, 
    dispatch, 
    onGenerate,
    isGenerating,
    generations,
    isGenerationsLoading,
    templates,
    isTemplatesLoading,
    communityListings,
    isCommunityLoading
}: Props) {
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
                <div className="flex-1 overflow-y-auto p-4 space-y-6 text-left">
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
                                        placeholder="Enter text..."
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
                                                state.selectedLanguage === lang.id ? 'bg-accent border border-primary/20' : 'bg-card border border-border text-muted-foreground',
                                            )}
                                        >
                                            <Languages className="w-4 h-4" />
                                            <span className="truncate w-full text-center">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="aspect-[3/1] rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground/50" />
                                <div className="text-center">
                                    <p className="text-xs font-medium">Upload Sample</p>
                                    <p className="text-[10px] text-muted-foreground">MP3, WAV</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <Button onClick={onGenerate} disabled={isGenerating || !state.text.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                        {isGenerating ? 'Generating...' : 'Generate Voice'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {CONTENT_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setActiveContentTab', tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                                    state.activeContentTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {state.activeContentTab === CONTENT_TABS[0] && ( // Personal
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Your Generations</h2>
                            {isGenerationsLoading ? (
                                <LoadingGrid />
                            ) : generations.length > 0 ? (
                                <div className="space-y-3">
                                    {generations.map((gen) => (
                                        <GenerationCard key={gen.id} generation={gen} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No voices yet. Start creating!" />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === COMMUNITY_TAB && ( // Community
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Community Voices</h2>
                            {isCommunityLoading ? (
                                <LoadingGrid />
                            ) : communityListings.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {communityListings.map((listing) => (
                                        <VoiceCard key={listing.id} voice={listing} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No community voices found." />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === TEMPLATES_TAB && ( // Templates
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Voice Presets</h2>
                            {isTemplatesLoading ? (
                                <LoadingGrid />
                            ) : templates.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template) => (
                                        <VoiceCard key={template.id} voice={template} onClick={() => dispatch({ type: 'setText', text: template.title })} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No voice presets available." />
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function GenerationCard({ generation }: { generation: any }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group text-left">
            <button className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0">
                <Play className="w-5 h-5 fill-current" />
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{generation.prompt}</p>
                <p className="text-xs text-muted-foreground capitalize">{generation.status}</p>
            </div>
            <Button variant="outline" size="icon" className="w-8 h-8">
                <Download className="w-4 h-4" />
            </Button>
        </div>
    );
}

function VoiceCard({ voice, onClick }: { voice: any; onClick?: () => void }) {
    return (
        <div className="p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors text-left group">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{voice.title || voice.name}</p>
                    <p className="text-[10px] text-muted-foreground">{voice.description || 'Professional Voice'}</p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={onClick}>
                <Play className="w-3 h-3 fill-current" />
                Preview
            </Button>
        </div>
    );
}
