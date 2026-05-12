'use client';

import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { Suspense, useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner';
import {
    Upload,
    Sparkles,
    Grid3X3,
    Play,
    Pause,
    Music,
    Music2,
    Mic,
    Volume2,
    Loader2,
    Download,
    Folder,
    Clock,
    Zap,
    Guitar,
    Headphones,
    Piano,
    Waves,
    Clapperboard,
    Coffee,
    Heart,
    Mountain,
    Trees,
    Smile,
    Frown,
    MoonStar,
    Moon
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { createTrackFilename, getTrackPreviewUrl, toMusicTrackRow, type MusicTrackRow } from '@/lib/music-track';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { uploadFileWithToast } from '@/lib/upload';
import type { MediaItem } from '@/types/media';
import { MUSIC_CONTENT_TABS } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { getUserFacingErrorMessage } from '@/lib/async-operation';

const genres = [
    { id: 'pop', name: 'Pop', icon: Music2 },
    { id: 'rock', name: 'Rock', icon: Guitar },
    { id: 'electronic', name: 'Electronic', icon: Headphones },
    { id: 'classical', name: 'Classical', icon: Piano },
    { id: 'jazz', name: 'Jazz', icon: Music },
    { id: 'ambient', name: 'Ambient', icon: Waves },
    { id: 'cinematic', name: 'Cinematic', icon: Clapperboard },
    { id: 'lofi', name: 'Lo-Fi', icon: Coffee },
    { id: 'hiphop', name: 'Hip Hop', icon: Mic },
    { id: 'rnb', name: 'R&B', icon: Heart },
    { id: 'country', name: 'Country', icon: Mountain },
    { id: 'reggae', name: 'Reggae', icon: Trees },
];

const moods = [
    { id: 'happy', label: 'Happy', icon: Smile },
    { id: 'sad', label: 'Sad', icon: Frown },
    { id: 'energetic', label: 'Energetic', icon: Zap },
    { id: 'calm', label: 'Calm', icon: MoonStar },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'uplifting', label: 'Uplifting', icon: Sparkles },
    { id: 'romantic', label: 'Romantic', icon: Heart },
    { id: 'epic', label: 'Epic', icon: Mountain },
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

type MusicSnapshot = {
    activeContentTab: string;
    selectedGenre: string | null;
    selectedMoods: string[];
    selectedInstruments: string[];
    prompt: string;
    duration: string;
    tempo: number;
    referenceTrackUrl: string | null;
    referenceTrackName: string;
};

type MusicProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<MusicSnapshot>;
};

type CommunityMusicListing = {
    id: string;
    title: string;
    description?: string;
    metadata?: {
        genre?: string;
        duration?: string;
        bpm?: number;
    } | null;
    resultUrl?: string | null;
};

type MusicGeneratorState = MusicSnapshot & {
    communityListings: CommunityMusicListing[];
    isCommunityLoading: boolean;
    playingTrackId: string | null;
    isAudioPickerOpen: boolean;
};

type MusicGeneratorAction =
    | { type: 'set-content-tab'; tab: string }
    | { type: 'set-community-listings'; listings: CommunityMusicListing[] }
    | { type: 'set-community-loading'; value: boolean }
    | { type: 'apply-snapshot'; snapshot: Partial<MusicSnapshot> }
    | { type: 'set-selected-genre'; value: string | null }
    | { type: 'toggle-mood'; id: string }
    | { type: 'toggle-instrument'; id: string }
    | { type: 'set-prompt'; value: string }
    | { type: 'set-duration'; value: string }
    | { type: 'set-tempo'; value: number }
    | { type: 'set-playing-track-id'; value: string | null }
    | { type: 'set-reference-track'; url: string | null; name: string }
    | { type: 'set-audio-picker-open'; value: boolean }
    | { type: 'reset-form' };

const initialMusicGeneratorState: MusicGeneratorState = {
    activeContentTab: MUSIC_CONTENT_TABS[0],
    communityListings: [],
    isCommunityLoading: false,
    selectedGenre: null,
    selectedMoods: [],
    selectedInstruments: [],
    prompt: '',
    duration: '30',
    tempo: 120,
    referenceTrackUrl: null,
    referenceTrackName: '',
    playingTrackId: null,
    isAudioPickerOpen: false,
};

const musicGeneratorReducer = (state: MusicGeneratorState, action: MusicGeneratorAction): MusicGeneratorState => {
    switch (action.type) {
        case 'set-content-tab':
            return { ...state, activeContentTab: action.tab };
        case 'set-community-listings':
            return { ...state, communityListings: action.listings };
        case 'set-community-loading':
            return { ...state, isCommunityLoading: action.value };
        case 'apply-snapshot':
            return {
                ...state,
                activeContentTab: action.snapshot.activeContentTab ?? MUSIC_CONTENT_TABS[0],
                selectedGenre: action.snapshot.selectedGenre ?? null,
                selectedMoods: action.snapshot.selectedMoods ?? [],
                selectedInstruments: action.snapshot.selectedInstruments ?? [],
                prompt: action.snapshot.prompt ?? '',
                duration: action.snapshot.duration ?? '30',
                tempo: action.snapshot.tempo ?? 120,
                referenceTrackUrl: action.snapshot.referenceTrackUrl ?? null,
                referenceTrackName: action.snapshot.referenceTrackName ?? '',
                playingTrackId: null,
            };
        case 'set-selected-genre':
            return { ...state, selectedGenre: action.value };
        case 'toggle-mood':
            return {
                ...state,
                selectedMoods: state.selectedMoods.includes(action.id)
                    ? state.selectedMoods.filter((mood) => mood !== action.id)
                    : [...state.selectedMoods, action.id],
            };
        case 'toggle-instrument':
            return {
                ...state,
                selectedInstruments: state.selectedInstruments.includes(action.id)
                    ? state.selectedInstruments.filter((instrument) => instrument !== action.id)
                    : [...state.selectedInstruments, action.id],
            };
        case 'set-prompt':
            return { ...state, prompt: action.value };
        case 'set-duration':
            return { ...state, duration: action.value };
        case 'set-tempo':
            return { ...state, tempo: action.value };
        case 'set-playing-track-id':
            return { ...state, playingTrackId: action.value };
        case 'set-reference-track':
            return { ...state, referenceTrackUrl: action.url, referenceTrackName: action.name };
        case 'set-audio-picker-open':
            return { ...state, isAudioPickerOpen: action.value };
        case 'reset-form':
            return {
                ...state,
                selectedGenre: null,
                selectedMoods: [],
                selectedInstruments: [],
                prompt: '',
                duration: '30',
                tempo: 120,
                playingTrackId: null,
                referenceTrackUrl: null,
                referenceTrackName: '',
                isAudioPickerOpen: false,
            };
        default:
            return state;
    }
};

const normalizeMusicSnapshot = (value: unknown): Partial<MusicSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : MUSIC_CONTENT_TABS[0],
        selectedGenre: typeof snapshot.selectedGenre === 'string' ? snapshot.selectedGenre : null,
        selectedMoods: Array.isArray(snapshot.selectedMoods) ? snapshot.selectedMoods.filter((item): item is string => typeof item === 'string') : [],
        selectedInstruments: Array.isArray(snapshot.selectedInstruments) ? snapshot.selectedInstruments.filter((item): item is string => typeof item === 'string') : [],
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
        duration: typeof snapshot.duration === 'string' ? snapshot.duration : '30',
        tempo: typeof snapshot.tempo === 'number' ? snapshot.tempo : 120,
        referenceTrackUrl: typeof snapshot.referenceTrackUrl === 'string' ? snapshot.referenceTrackUrl : null,
        referenceTrackName: typeof snapshot.referenceTrackName === 'string' ? snapshot.referenceTrackName : '',
    };
};

export default function MusicGeneratorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <MusicGeneratorPageContent />
        </Suspense>
    );
}

function MusicGeneratorPageContent() {
    const {
        generateMusic,
        isGenerating,
        generations,
        fetchGenerations,
        isLoading: isGenerationsLoading
    } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const [state, dispatch] = useReducer(musicGeneratorReducer, initialMusicGeneratorState);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (state.activeContentTab === MUSIC_CONTENT_TABS[0]) {
            fetchGenerations({ type: TemplateTypeEnum.MUSIC_GENERATOR, limit: 12 });
        } else if (state.activeContentTab === MUSIC_CONTENT_TABS[1]) {
            const fetchCommunity = async () => {
                dispatch({ type: 'set-community-loading', value: true });
                try {
                    const res = await import('@/lib/api').then((m) => m.get<{ data: CommunityMusicListing[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.MUSIC_GENERATOR}&limit=12`));
                    dispatch({ type: 'set-community-listings', listings: res.data || [] });
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    dispatch({ type: 'set-community-loading', value: false });
                }
            };
            fetchCommunity();
        } else if (state.activeContentTab === MUSIC_CONTENT_TABS[2]) {
            fetchTemplates(TemplateTypeEnum.MUSIC_GENERATOR);
        }
    }, [state.activeContentTab, fetchGenerations, fetchTemplates]);

    useEffect(() => {
        const applySnapshot = (snapshot: Partial<MusicSnapshot>) => {
            dispatch({ type: 'apply-snapshot', snapshot });
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('music-generator:draft:v1');
            if (!draftRaw) return;

            try {
                applySnapshot(normalizeMusicSnapshot(JSON.parse(draftRaw)));
            } catch (error) {
                console.error('Failed to load music draft', error);
            }
        };

        loadDraft();
    }, []);

    const toggleMood = (id: string) => {
        dispatch({ type: 'toggle-mood', id });
    };

    const toggleInstrument = (id: string) => {
        dispatch({ type: 'toggle-instrument', id });
    };

    const handleGenerate = async () => {
        if (!state.prompt.trim()) return;

        try {
            await generateMusic({
                prompt: state.prompt,
                genre: state.selectedGenre || undefined,
                moods: state.selectedMoods.length > 0 ? state.selectedMoods : undefined,
                instruments: state.selectedInstruments.length > 0 ? state.selectedInstruments : undefined,
                duration: parseInt(state.duration),
                tempo: state.tempo,
            });
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, 'Failed to generate music'));
        }
    };

    const handleReset = () => {
        dispatch({ type: 'reset-form' });
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!state.playingTrackId) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            return;
        }

        const currentTrack = generations.find((gen) => gen.id === state.playingTrackId);
        const previewUrl = currentTrack?.resultUrl?.trim();

        if (!previewUrl) {
            audio.pause();
            return;
        }

        audio.src = previewUrl;
        audio.currentTime = 0;

        void audio.play().catch(() => {
            dispatch({ type: 'set-playing-track-id', value: null });
            toast.error('Unable to preview this track right now.');
        });
    }, [state.playingTrackId, generations]);

    const handleSaveDraft = () => {
        const payload: MusicProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                activeContentTab: state.activeContentTab,
                selectedGenre: state.selectedGenre,
                selectedMoods: state.selectedMoods,
                selectedInstruments: state.selectedInstruments,
                prompt: state.prompt,
                duration: state.duration,
                tempo: state.tempo,
                referenceTrackUrl: state.referenceTrackUrl,
                referenceTrackName: state.referenceTrackName,
            },
        };

        localStorage.setItem('music-generator:draft:v1', JSON.stringify(payload));
        toast.success('Music draft saved locally.');
    };

    const handleReferenceUpload = async (file: File) => {
        const uploaded = await uploadFileWithToast(file, file.name);
        if (!uploaded?.url) return;

        dispatch({ type: 'set-reference-track', url: uploaded.url, name: file.name });
    };

    const handleReferenceSelect = (media: MediaItem) => {
        dispatch({ type: 'set-reference-track', url: media.url, name: media.name });
    };

    const downloadJson = (filename: string, payload: unknown) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleTrackSave = (track: MusicTrackRow) => {
        localStorage.setItem(`music-generator:track:v1:${track.id}`, JSON.stringify(track));
        toast.success(`Saved ${track.title} locally.`);
    };

    const handleTrackDownload = async (track: MusicTrackRow) => {
        const previewUrl = getTrackPreviewUrl(track);

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
                link.download = createTrackFilename(track, extension);
                link.click();
                URL.revokeObjectURL(url);
                toast.success(`Downloaded ${track.title}.`);
                return;
            } catch (error) {
                console.error('Failed to download audio preview, falling back to JSON export', error);
            }
        }

        downloadJson(createTrackFilename(track, 'json'), track);
        toast.success(`Downloaded ${track.title} metadata.`);
    };

    const toggleTrackPlayback = (track: MusicTrackRow) => {
        const previewUrl = getTrackPreviewUrl(track);

        if (!previewUrl) {
            toast.info('This track does not have a rendered audio preview yet.');
            return;
        }

        if (state.playingTrackId === track.id) {
            dispatch({ type: 'set-playing-track-id', value: null });
            return;
        }

        dispatch({ type: 'set-playing-track-id', value: track.id });
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Music Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-6">
                    <button
                        onClick={() => dispatch({ type: 'set-content-tab', tab: MUSIC_CONTENT_TABS[2] })}
                        className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                                <Music className="size-5 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">Browse presets</span>
                        </div>
                        <Grid3X3 className="size-4 text-muted-foreground" />
                    </button>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Genre</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {genres.map((genre) => (
                                <button
                                    key={genre.id}
                                    onClick={() => dispatch({ type: 'set-selected-genre', value: state.selectedGenre === genre.id ? null : genre.id })}
                                    className={cn(
                                        'p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] transition-all border',
                                        state.selectedGenre === genre.id
                                            ? 'bg-accent border-primary/20 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-border/80'
                                    )}
                                >
                                    <genre.icon className="size-4 text-muted-foreground" />
                                    <span className="truncate w-full text-center">{genre.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Mood</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {moods.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => toggleMood(mood.id)}
                                    className={cn(
                                        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.selectedMoods.includes(mood.id)
                                            ? 'bg-accent border border-primary/20 text-foreground'
                                            : 'bg-card border border-border text-muted-foreground'
                                    )}
                                >
                                    <mood.icon className="size-3.5" />
                                    <span>{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Instruments</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {instruments.map((inst) => (
                                <button
                                    key={inst.id}
                                    onClick={() => toggleInstrument(inst.id)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.selectedInstruments.includes(inst.id)
                                            ? 'bg-accent border border-primary/20 text-foreground'
                                            : 'bg-card border border-border text-muted-foreground'
                                    )}
                                >
                                    {inst.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                        <div className="flex items-center gap-1.5">
                            {['15', '30', '60', '120', '180'].map((duration) => (
                                <button
                                    key={duration}
                                    onClick={() => dispatch({ type: 'set-duration', value: duration })}
                                    className={cn(
                                        'flex-1 py-2 rounded-lg text-[10px] font-medium transition-all',
                                        state.duration === duration
                                            ? 'bg-accent border border-primary/20 text-foreground'
                                            : 'bg-card border border-border text-muted-foreground'
                                    )}
                                >
                                    {duration}s
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-muted-foreground">Tempo</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.tempo} BPM</span>
                        </div>
                        <Slider
                            min={60}
                            max={200}
                            step={5}
                            value={[state.tempo]}
                            onValueChange={([value]) => dispatch({ type: 'set-tempo', value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'set-prompt', value: e.target.value })}
                                placeholder="Describe the music you want to create? e.g., 'Upbeat energetic music for a workout video with strong drums and synths'"
                                className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Reference (Optional)</h4>
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'set-audio-picker-open', value: true })}
                            className="w-full aspect-[4/1] rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2 text-left px-4"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="size-5 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">
                                    {state.referenceTrackName || 'Drop audio or click'}
                                </span>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => dispatch({ type: 'set-audio-picker-open', value: true })}
                            >
                                <Folder className="size-4" />
                                Choose from uploads
                            </Button>
                            <Button
                                type="button"
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
                                            await handleReferenceUpload(file);
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                <Upload className="size-4" />
                                Upload file
                            </Button>
                        </div>
                        {state.referenceTrackUrl && (
                            <audio className="w-full" controls src={state.referenceTrackUrl} />
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{parseInt(state.duration) <= 30 ? '2' : parseInt(state.duration) <= 60 ? '4' : '8'} Credits</span>
                    </div>
                    <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="h-12 flex-1 font-bold rounded-xl gap-2"
                    >
                            <Folder className="size-5" />
                            Reset
                        </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !state.prompt.trim()}
                        className="h-12 flex-[2] font-bold rounded-xl gap-2"
                    >
                            {isGenerating ? (
                                <><Loader2 className="size-5 animate-spin" /> Composing?</>
                            ) : (
                                <><Music className="size-5" /> Generate Music</>
                            )}
                        </Button>
                    </div>
                </div>

                <MediaPickerModal
                    isOpen={state.isAudioPickerOpen}
                    onClose={() => dispatch({ type: 'set-audio-picker-open', value: false })}
                    onSelect={handleReferenceSelect}
                    mediaType="audio"
                />
            </div>

            <audio
                ref={audioRef}
                className="hidden"
                onEnded={() => dispatch({ type: 'set-playing-track-id', value: null })}
                onPause={() => {
                    if (audioRef.current && audioRef.current.currentTime === 0) {
                        dispatch({ type: 'set-playing-track-id', value: null });
                    }
                }}
            />

            <div className="flex-1 overflow-y-auto bg-background">
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-6 h-14 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-1">
                        {MUSIC_CONTENT_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'set-content-tab', tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                                    state.activeContentTab === tab
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveDraft}
                            disabled={isGenerating}
                            className="gap-2"
                        >
                            <Folder className="size-4" />
                            Save asset
                        </Button>
                    </div>
                </div>

                <div className="p-6">
                    {state.activeContentTab === MUSIC_CONTENT_TABS[0] && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4">My Creations</h3>
                            {isGenerationsLoading ? (
                                <LoadingList />
                            ) : generations.length > 0 ? (
                                <div className="space-y-3">
                                    {generations.map((generation) => {
                                        const track = toMusicTrackRow({
                                            id: generation.id,
                                            title: generation.prompt || 'AI Generated Track',
                                            genre: typeof generation.metadata?.genre === 'string' ? generation.metadata.genre : 'AI Generated',
                                            duration: `${typeof generation.metadata?.duration === 'number' ? generation.metadata.duration : 0}s`,
                                            bpm: typeof generation.metadata?.tempo === 'number' ? generation.metadata.tempo : 120,
                                            time: 'Just now',
                                            resultUrl: typeof generation.resultUrl === 'string' ? generation.resultUrl : undefined,
                                        });

                                        return (
                                            <TrackRow
                                                key={generation.id}
                                                track={track}
                                                isPlaying={state.playingTrackId === generation.id}
                                                onTogglePlay={() => toggleTrackPlayback(track)}
                                                onSave={() => handleTrackSave(track)}
                                                onDownload={() => handleTrackDownload(track)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState message="No generated tracks yet." />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === MUSIC_CONTENT_TABS[1] && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Community Showcase</h3>
                            {state.isCommunityLoading ? (
                                <LoadingList />
                            ) : state.communityListings.length > 0 ? (
                                <div className="space-y-3">
                                    {state.communityListings.map((listing) => {
                                        const track = toMusicTrackRow({
                                            id: listing.id,
                                            title: listing.title,
                                            genre: typeof listing.metadata?.genre === 'string' ? listing.metadata.genre : 'Community',
                                            duration: typeof listing.metadata?.duration === 'string' ? listing.metadata.duration : '3:00',
                                            bpm: typeof listing.metadata?.bpm === 'number' ? listing.metadata.bpm : 120,
                                            time: 'Recently',
                                            resultUrl: typeof listing.resultUrl === 'string' ? listing.resultUrl : undefined,
                                        });

                                        return (
                                            <TrackRow
                                                key={listing.id}
                                                track={track}
                                                isPlaying={state.playingTrackId === listing.id}
                                                onTogglePlay={() => toggleTrackPlayback(track)}
                                                onSave={() => handleTrackSave(track)}
                                                onDownload={() => handleTrackDownload(track)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState message="No community tracks found." />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === MUSIC_CONTENT_TABS[2] && (
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Music Presets</h3>
                            {isTemplatesLoading ? (
                                <LoadingList />
                            ) : templates.length > 0 ? (
                                <div className="space-y-3">
                                    {templates.map((template) => {
                                        const trackRow = toMusicTrackRow({
                                            id: template.id,
                                            title: template.title,
                                            genre: template.type,
                                            duration: '0:30',
                                            bpm: 120,
                                            time: 'Preset',
                                        });

                                        return (
                                            <TrackRow
                                                key={template.id}
                                                track={trackRow}
                                                isPlaying={state.playingTrackId === template.id}
                                                onTogglePlay={() => toggleTrackPlayback(trackRow)}
                                                onSave={() => handleTrackSave(trackRow)}
                                                onDownload={() => handleTrackDownload(trackRow)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sampleTracks.map((track) => (
                                        <TrackRow
                                            key={track.id}
                                            track={toMusicTrackRow(track)}
                                            isPlaying={state.playingTrackId === track.id}
                                            onTogglePlay={() => toggleTrackPlayback(toMusicTrackRow(track))}
                                            onSave={() => handleTrackSave(toMusicTrackRow(track))}
                                            onDownload={() => handleTrackDownload(toMusicTrackRow(track))}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {state.activeContentTab === MUSIC_CONTENT_TABS[3] && (
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                            <Mic className="size-6 text-muted-foreground" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Voice Cloning</h4>
                                        <p className="text-sm text-muted-foreground">Clone any voice and use it in your projects</p>
                                    </div>
                                    <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                            <Music className="size-6 text-muted-foreground" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Custom Soundtracks</h4>
                                        <p className="text-sm text-muted-foreground">Generate unique music for videos and games</p>
                                    </div>
                                    <div className="p-6 bg-card rounded-2xl border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                                        <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                            <Volume2 className="size-6 text-muted-foreground" />
                                        </div>
                                        <h4 className="font-semibold mb-2">Sound Effects</h4>
                                        <p className="text-sm text-muted-foreground">Create custom sound effects from text</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}

function LoadingList() {
    return (
        <div className="space-y-3">
            {['music-skel-1', 'music-skel-2', 'music-skel-3'].map((id) => (
                <div key={id} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Music className="size-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function TrackRow({ track, isPlaying, onTogglePlay, onSave, onDownload }: { track: MusicTrackRow, isPlaying: boolean, onTogglePlay: () => void, onSave: () => void | Promise<void>, onDownload: () => void | Promise<void> }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group cursor-pointer">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                }}
                className="size-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent transition-colors shrink-0"
            >
                {isPlaying ? (
                    <Pause className="size-5" />
                ) : (
                    <Play className="size-5 fill-current" />
                )}
            </button>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{track.title}</h4>
                <p className="text-xs text-muted-foreground">{track.genre} â€¢ {track.duration} â€¢ {track.bpm} BPM</p>
            </div>
            <div className="hidden md:flex items-center gap-[2px] h-8 flex-1 max-w-[300px]">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'w-[2px] rounded-full transition-colors',
                            isPlaying ? 'bg-primary' : 'bg-muted-foreground/20'
                        )}
                        style={{ height: `${Math.sin(i * 0.3) * 12 + 16}px` }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{track.time}</span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <Button variant="outline" size="icon" className="size-8" onClick={onSave}><Folder className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={onDownload}><Download className="size-4" /></Button>
            </div>
        </div>
    );
}
