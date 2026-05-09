import React from 'react';
import { toast } from 'sonner';
import {
    Volume2,
    Upload,
    Download,
    Loader2,
    Play,
    User,
    Languages,
    Sparkles,
    Folder,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { createVoiceExportFilename, getVoicePreviewUrl, type VoiceTrackLike } from '@/lib/voice-track';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import type { VoiceGeneratorState, VoiceGeneratorAction } from './page';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';

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

type VoiceGenerationItem = {
    id: string;
    prompt: string;
    status: string;
    resultUrl?: string | null;
} & VoiceTrackLike;

type VoiceListingItem = {
    id: string;
    title?: string;
    name?: string;
    description?: string;
};

type VoiceTemplateItem = {
    id: string;
    title: string;
    description?: string;
};

type Props = {
    state: VoiceGeneratorState;
    dispatch: React.Dispatch<VoiceGeneratorAction>;
    onGenerate: () => void;
    onReset: () => void;
    onSaveProject: () => void;
    onPickSample: () => void;
    onUploadSample: (file: File) => Promise<void>;
    isGenerating: boolean;
    generations: VoiceGenerationItem[];
    isGenerationsLoading: boolean;
    templates: VoiceTemplateItem[];
    isTemplatesLoading: boolean;
    communityListings: VoiceListingItem[];
    isCommunityLoading: boolean;
    sampleUrl: string | null;
    sampleName: string;
    projectError: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
};

export function VoiceGeneratorView({ 
    state,
    dispatch,
    onGenerate,
    onReset,
    onSaveProject,
    onPickSample,
    onUploadSample,
    isGenerating,
    generations,
    isGenerationsLoading,
    templates,
    isTemplatesLoading,
    communityListings,
    isCommunityLoading,
    sampleUrl,
    sampleName,
    projectError,
    isProjectLoading,
    isProjectSaving,
}: Props) {
    const isProjectBusy = isProjectLoading || isProjectSaving;

    return (
        <CreatorWorkspaceShell>
            <div className="w-[340px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Voice Generator</h2>
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
                                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Text</h4>
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
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Language</h4>
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
                                            <Languages className="size-4" />
                                            <span className="truncate w-full text-center">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={onPickSample}
                                className="aspect-[3/1] w-full rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2"
                            >
                                <Upload className="size-6 text-muted-foreground/50" />
                                <div className="text-center">
                                    <p className="text-xs font-medium">{sampleName || 'Upload Sample'}</p>
                                    <p className="text-[10px] text-muted-foreground">MP3, WAV</p>
                                </div>
                            </button>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onPickSample}>
                                    <Folder className="size-4" />
                                    Choose from uploads
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-2"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'audio/*';
                                        input.onchange = async () => {
                                            const file = input.files?.[0];
                                            if (file) {
                                                await onUploadSample(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                >
                                    <Upload className="size-4" />
                                    Upload file
                                </Button>
                            </div>
                            {sampleUrl && (
                                <audio className="w-full" controls src={sampleUrl} />
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onReset} disabled={isProjectBusy} className="h-12 flex-1 font-bold rounded-xl gap-2">
                            <Folder className="size-5" />
                            Reset
                        </Button>
                        <Button variant="outline" onClick={onSaveProject} disabled={isProjectBusy || isGenerating} className="h-12 flex-1 font-bold rounded-xl gap-2">
                            {isProjectSaving ? <Loader2 className="size-5 animate-spin" /> : <Folder className="size-5" />}
                            Save
                        </Button>
                        <Button onClick={onGenerate} disabled={isGenerating || isProjectBusy || !state.text.trim()} className="h-12 flex-[2] font-bold rounded-xl gap-2">
                            {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <Volume2 className="size-5" />}
                            {isGenerating ? 'Generating...' : 'Generate Voice'}
                        </Button>
                    </div>
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
                    {projectError && (
                        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {projectError}
                        </div>
                    )}
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
        </CreatorWorkspaceShell>
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
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function GenerationCard({ generation }: { generation: VoiceGenerationItem }) {
    const handlePreview = async () => {
        const previewUrl = getVoicePreviewUrl(generation);

        if (previewUrl) {
            try {
                const audio = new Audio(previewUrl);
                await audio.play();
                return;
            } catch (error) {
                console.error('Failed to preview voice audio, falling back to speech synthesis', error);
            }
        }

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            toast.info('Audio preview is not available in this browser.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(generation.prompt);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleDownload = async () => {
        const previewUrl = getVoicePreviewUrl(generation);

        if (previewUrl) {
            try {
                const response = await fetch(previewUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch preview (${response.status})`);
                }

                const blob = await response.blob();
                const mimeType = blob.type || 'audio/mpeg';
                const extension = mimeType.split('/')[1]?.split('+')[0] || 'mp3';
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = createVoiceExportFilename(generation, extension);
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Voice audio exported.');
                return;
            } catch (error) {
                console.error('Failed to download voice audio preview, falling back to JSON export', error);
            }
        }

        const blob = new Blob([JSON.stringify({
            version: 1,
            exportedAt: new Date().toISOString(),
            id: generation.id,
            prompt: generation.prompt,
            status: generation.status,
        }, null, 2)], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = createVoiceExportFilename(generation, 'json');
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Voice generation exported.');
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group text-left">
            <button className="size-12 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0" onClick={handlePreview}>
                <Play className="size-5 fill-current" />
            </button>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{generation.prompt}</p>
                <p className="text-xs text-muted-foreground capitalize">{generation.status}</p>
            </div>
            <Button variant="outline" size="icon" className="size-8" onClick={handleDownload}>
                <Download className="size-4" />
            </Button>
        </div>
    );
}

function VoiceCard({ voice, onClick }: { voice: VoiceListingItem; onClick?: () => void }) {
    return (
        <div className="p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors text-left group">
            <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="size-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{voice.title || voice.name}</p>
                    <p className="text-[10px] text-muted-foreground">{voice.description || 'Professional Voice'}</p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={onClick}>
                <Play className="size-3 fill-current" />
                Preview
            </Button>
        </div>
    );
}
