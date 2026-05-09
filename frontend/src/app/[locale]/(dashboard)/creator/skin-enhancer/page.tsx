'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import { Sparkles, Upload, Download, Loader2, RotateCcw, Eye, EyeOff, Folder, Droplets, SunMedium, Palette, TimerReset, Zap } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const enhancementModes = [
    { id: 'natural', label: 'Natural', description: 'Subtle, realistic enhancement' },
    { id: 'beauty', label: 'Beauty', description: 'Glamorous beauty retouch' },
    { id: 'professional', label: 'Professional', description: 'Studio-quality result' },
    { id: 'editorial', label: 'Editorial', description: 'Magazine-ready finish' },
];

const presets = [
    { id: 'clear-skin', label: 'Clear Skin', icon: Sparkles },
    { id: 'smooth', label: 'Smooth', icon: Droplets },
    { id: 'bright', label: 'Brighten', icon: SunMedium },
    { id: 'tone-even', label: 'Even Tone', icon: Palette },
    { id: 'anti-aging', label: 'Anti-aging', icon: TimerReset },
    { id: 'glow', label: 'Glow', icon: Zap },
];

type SkinEnhancerState = {
    uploadedImage: string | null;
    mode: string;
    selectedPresets: string[];
    smoothness: number;
    brightness: number;
    blemishRemoval: number;
    wrinkleReduction: number;
    eyeEnhance: number;
    showOriginal: boolean;
};

type SkinEnhancerSnapshot = {
    uploadedImage: string | null;
    resultImage: string | null;
    mode: string;
    selectedPresets: string[];
    smoothness: number;
    brightness: number;
    blemishRemoval: number;
    wrinkleReduction: number;
    eyeEnhance: number;
    showOriginal: boolean;
};

type SkinEnhancerProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<SkinEnhancerSnapshot>;
};

const normalizeSkinEnhancerSnapshot = (value: unknown): Partial<SkinEnhancerSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        resultImage: typeof snapshot.resultImage === 'string' ? snapshot.resultImage : null,
        mode: typeof snapshot.mode === 'string' ? snapshot.mode : initialState.mode,
        selectedPresets: Array.isArray(snapshot.selectedPresets)
            ? snapshot.selectedPresets.filter((item): item is string => typeof item === 'string')
            : initialState.selectedPresets,
        smoothness: typeof snapshot.smoothness === 'number' ? snapshot.smoothness : initialState.smoothness,
        brightness: typeof snapshot.brightness === 'number' ? snapshot.brightness : initialState.brightness,
        blemishRemoval: typeof snapshot.blemishRemoval === 'number' ? snapshot.blemishRemoval : initialState.blemishRemoval,
        wrinkleReduction: typeof snapshot.wrinkleReduction === 'number' ? snapshot.wrinkleReduction : initialState.wrinkleReduction,
        eyeEnhance: typeof snapshot.eyeEnhance === 'number' ? snapshot.eyeEnhance : initialState.eyeEnhance,
        showOriginal: typeof snapshot.showOriginal === 'boolean' ? snapshot.showOriginal : initialState.showOriginal,
    };
};

type SkinEnhancerAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setMode'; mode: string }
    | { type: 'setSelectedPresets'; selectedPresets: string[] }
    | { type: 'togglePreset'; presetId: string }
    | { type: 'setSmoothness'; smoothness: number }
    | { type: 'setBrightness'; brightness: number }
    | { type: 'setBlemishRemoval'; blemishRemoval: number }
    | { type: 'setWrinkleReduction'; wrinkleReduction: number }
    | { type: 'setEyeEnhance'; eyeEnhance: number }
    | { type: 'setShowOriginal'; showOriginal: boolean }
    | { type: 'toggleShowOriginal' }
    | { type: 'reset' };

const initialState: SkinEnhancerState = {
    uploadedImage: null,
    mode: 'natural',
    selectedPresets: ['clear-skin'],
    smoothness: 50,
    brightness: 30,
    blemishRemoval: 70,
    wrinkleReduction: 40,
    eyeEnhance: 30,
    showOriginal: false,
};

function reducer(state: SkinEnhancerState, action: SkinEnhancerAction): SkinEnhancerState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setMode':
            return { ...state, mode: action.mode };
        case 'setSelectedPresets':
            return { ...state, selectedPresets: action.selectedPresets };
        case 'togglePreset':
            return {
                ...state,
                selectedPresets: state.selectedPresets.includes(action.presetId)
                    ? state.selectedPresets.filter((preset) => preset !== action.presetId)
                    : [...state.selectedPresets, action.presetId],
            };
        case 'setSmoothness':
            return { ...state, smoothness: action.smoothness };
        case 'setBrightness':
            return { ...state, brightness: action.brightness };
        case 'setBlemishRemoval':
            return { ...state, blemishRemoval: action.blemishRemoval };
        case 'setWrinkleReduction':
            return { ...state, wrinkleReduction: action.wrinkleReduction };
        case 'setEyeEnhance':
            return { ...state, eyeEnhance: action.eyeEnhance };
        case 'setShowOriginal':
            return { ...state, showOriginal: action.showOriginal };
        case 'toggleShowOriginal':
            return { ...state, showOriginal: !state.showOriginal };
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function SkinEnhancerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <SkinEnhancerPageContent />
        </Suspense>
    );
}

function SkinEnhancerPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [restoredResultImage, setRestoredResultImage] = useState<string | null>(null);
    const { skinEnhance, currentGeneration, reset, isGenerating } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const resultImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : restoredResultImage;
    const isProcessing = isGenerating;

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrateFromSnapshot = (snapshot: Partial<SkinEnhancerSnapshot>) => {
            dispatch({ type: 'setUploadedImage', uploadedImage: snapshot.uploadedImage ?? null });
            dispatch({ type: 'setMode', mode: snapshot.mode ?? initialState.mode });
            dispatch({
                type: 'setSelectedPresets',
                selectedPresets: Array.isArray(snapshot.selectedPresets) && snapshot.selectedPresets.length > 0
                    ? snapshot.selectedPresets
                    : initialState.selectedPresets,
            });
            dispatch({ type: 'setSmoothness', smoothness: snapshot.smoothness ?? initialState.smoothness });
            dispatch({ type: 'setBrightness', brightness: snapshot.brightness ?? initialState.brightness });
            dispatch({ type: 'setBlemishRemoval', blemishRemoval: snapshot.blemishRemoval ?? initialState.blemishRemoval });
            dispatch({ type: 'setWrinkleReduction', wrinkleReduction: snapshot.wrinkleReduction ?? initialState.wrinkleReduction });
            dispatch({ type: 'setEyeEnhance', eyeEnhance: snapshot.eyeEnhance ?? initialState.eyeEnhance });
            dispatch({ type: 'setShowOriginal', showOriginal: snapshot.showOriginal ?? initialState.showOriginal });
            setRestoredResultImage(snapshot.resultImage ?? null);
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const raw = localStorage.getItem('skin-enhancer:draft:v1');
                    if (raw) {
                        hydrateFromSnapshot(normalizeSkinEnhancerSnapshot(JSON.parse(raw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore skin enhancer draft', loadError);
                }
                return;
            }

            setIsProjectLoading(true);
            setProjectError(null);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
                if (!cancelled) {
                    hydrateFromSnapshot(normalizeSkinEnhancerSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore skin enhancer project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved skin enhancer project. Falling back to a local draft.');
                    try {
                        const raw = localStorage.getItem('skin-enhancer:draft:v1');
                        if (raw) {
                            hydrateFromSnapshot(normalizeSkinEnhancerSnapshot(JSON.parse(raw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore skin enhancer fallback', fallbackError);
                    }
                }
            } finally {
                if (!cancelled) {
                    setIsProjectLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            const uploaded = await mediaApi.uploadMedia(file);
            if (!uploaded?.url) {
                toast.error('Failed to upload image');
                return;
            }
            dispatch({ type: 'setUploadedImage', uploadedImage: uploaded.url });
        }
    };

    const togglePreset = (id: string) => {
        dispatch({ type: 'togglePreset', presetId: id });
    };

    const handleEnhance = async () => {
        if (!state.uploadedImage) return;
        try {
            await skinEnhance({
                imageUrl: state.uploadedImage,
                level: state.smoothness,
                mode: state.mode,
                preserveDetails: true,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to enhance skin');
        }
    };

    const handleSave = () => {
        const payload: SkinEnhancerProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                uploadedImage: state.uploadedImage,
                resultImage,
                mode: state.mode,
                selectedPresets: state.selectedPresets,
                smoothness: state.smoothness,
                brightness: state.brightness,
                blemishRemoval: state.blemishRemoval,
                wrinkleReduction: state.wrinkleReduction,
                eyeEnhance: state.eyeEnhance,
                showOriginal: state.showOriginal,
            },
        };

        localStorage.setItem('skin-enhancer:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Skin Enhancer Draft',
                        description: 'Skin enhancer draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Skin Enhancer Draft',
                        description: 'Skin enhancer draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Skin enhancer saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist skin enhancer project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExport = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uploadedImage: state.uploadedImage,
            resultImage,
            settings: {
                mode: state.mode,
                selectedPresets: state.selectedPresets,
                smoothness: state.smoothness,
                brightness: state.brightness,
                blemishRemoval: state.blemishRemoval,
                wrinkleReduction: state.wrinkleReduction,
                eyeEnhance: state.eyeEnhance,
                showOriginal: state.showOriginal,
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'skin-enhancer-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Skin enhancer export created.');
    };

    const handleReset = () => {
        reset();
        dispatch({ type: 'reset' });
        setRestoredResultImage(null);
        setProjectError(null);
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Skin Enhancer</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {isProjectLoading ? 'Loading project...' : projectError ?? ''}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    {/* Upload */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative aspect-[3/4] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {state.uploadedImage ? (
                            <Image src={state.uploadedImage} alt="Portrait" fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
                        ) : (
                            <><div className="size-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="size-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Portrait</p><p className="text-[10px] text-muted-foreground mt-1">Best with close-up face photos</p></div></>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Mode */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Enhancement Mode</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {enhancementModes.map((m) => (
                                <button key={m.id} onClick={() => dispatch({ type: 'setMode', mode: m.id })} className={cn("p-3 rounded-xl border transition-all text-left", state.mode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <p className="text-[11px] font-medium">{m.label}</p>
                                    <p className="text-[8px] text-muted-foreground">{m.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Quick Presets</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {presets.map((p) => (
                                <button key={p.id} onClick={() => togglePreset(p.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all inline-flex items-center gap-1.5", state.selectedPresets.includes(p.id) ? "bg-accent border border-primary/20 text-foreground" : "bg-card border border-border text-muted-foreground")}>
                                    <p.icon className="size-3" />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine Controls */}
                    <div className="space-y-5">
                            {[
                            { label: 'Smoothness', value: state.smoothness, setValue: (value: number) => dispatch({ type: 'setSmoothness', smoothness: value }) },
                            { label: 'Brightness', value: state.brightness, setValue: (value: number) => dispatch({ type: 'setBrightness', brightness: value }) },
                            { label: 'Blemish Removal', value: state.blemishRemoval, setValue: (value: number) => dispatch({ type: 'setBlemishRemoval', blemishRemoval: value }) },
                            { label: 'Wrinkle Reduction', value: state.wrinkleReduction, setValue: (value: number) => dispatch({ type: 'setWrinkleReduction', wrinkleReduction: value }) },
                            { label: 'Eye Enhancement', value: state.eyeEnhance, setValue: (value: number) => dispatch({ type: 'setEyeEnhance', eyeEnhance: value }) },
                        ].map((ctrl) => (
                            <div key={ctrl.label} className="space-y-3">
                                <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{ctrl.label}</Label><span className="text-[11px] font-mono">{ctrl.value}%</span></div>
                                <Slider min={0} max={100} step={5} value={[ctrl.value]} onValueChange={([v]) => ctrl.setValue(v)} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">1 Credit</span></div>
                    <Button onClick={handleEnhance} disabled={isProcessing || !state.uploadedImage || isProjectLoading || isProjectSaving} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="size-5 animate-spin" /> Enhancing?</>) : (<><Sparkles className="size-5" /> Enhance Skin</>)}
                    </Button>
                </div>
            </div>

            {/* Main Preview */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => dispatch({ type: 'toggleShowOriginal' })}>
                                {state.showOriginal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                {state.showOriginal ? 'Show Enhanced' : 'Show Original'}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleReset}><RotateCcw className="size-4" /> Reset</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isProjectLoading || isProjectSaving}><Folder className="size-4" /> Save</Button>
                            <Button size="sm" className="gap-2" onClick={handleExport}><Download className="size-4" /> Export</Button>
                        </div>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Sparkles className="size-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">AI Skin Enhancement</h3><p className="text-sm text-muted-foreground mt-1">Upload a portrait photo for natural-looking skin retouching</p></div>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">{['Portraits', 'Selfies', 'Headshots', 'Fashion'].map(t => (<span key={t} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">{t}</span>))}</div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Sparkles className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Enhancing skin?</p></div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                            <Image src={state.showOriginal ? state.uploadedImage! : (resultImage || state.uploadedImage!)} alt="Preview" width={1600} height={1600} className="max-h-[70vh] w-auto object-contain" />
                            {resultImage && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full border border-border text-xs font-medium">{state.showOriginal ? 'Original' : 'Enhanced'}</div>}
                        </div>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
