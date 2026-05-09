'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import { Box, Upload, Download, Loader2, Folder, Smartphone, Monitor, Tablet, Watch } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const mockupCategories = [
    { id: 'phone', label: 'Phone', icon: Smartphone, items: ['iPhone 15 Pro', 'Samsung S24', 'Pixel 8', 'iPhone SE'] },
    { id: 'laptop', label: 'Laptop', icon: Monitor, items: ['MacBook Pro 16"', 'MacBook Air', 'Dell XPS', 'Surface Pro'] },
    { id: 'tablet', label: 'Tablet', icon: Tablet, items: ['iPad Pro', 'iPad Air', 'Galaxy Tab', 'Surface Go'] },
    { id: 'watch', label: 'Watch', icon: Watch, items: ['Apple Watch', 'Galaxy Watch', 'Pixel Watch'] },
    { id: 'desktop', label: 'Desktop', icon: Monitor, items: ['iMac 27"', 'Studio Display', 'Dell Monitor', 'LG Ultrawide'] },
];

const scenes = [
    { id: 'minimal', label: 'Minimal', description: 'Clean white background' },
    { id: 'office', label: 'Office', description: 'Professional desk setup' },
    { id: 'cafe', label: 'Café', description: 'Cozy coffee shop' },
    { id: 'outdoor', label: 'Outdoor', description: 'Natural environment' },
    { id: 'dark', label: 'Dark Mode', description: 'Dark premium look' },
    { id: 'gradient', label: 'Gradient', description: 'Colorful gradient bg' },
    { id: 'floating', label: 'Floating', description: '3D floating in space' },
    { id: 'hand', label: 'Hand-held', description: 'Person holding device' },
];

type MockupState = {
    uploadedImage: string | null;
    selectedCategory: string;
    selectedDevice: string;
    selectedScene: string;
    angle: number;
    shadow: number;
    isGenerating: boolean;
    results: string[];
};

type MockupSnapshot = {
    uploadedImage: string | null;
    selectedCategory: string;
    selectedDevice: string;
    selectedScene: string;
    angle: number;
    shadow: number;
    results: string[];
};

type MockupProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<MockupSnapshot>;
};

type MockupAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setCategory'; selectedCategory: string; selectedDevice: string }
    | { type: 'setDevice'; selectedDevice: string }
    | { type: 'setScene'; selectedScene: string }
    | { type: 'setAngle'; angle: number }
    | { type: 'setShadow'; shadow: number }
    | { type: 'setGenerating'; isGenerating: boolean }
    | { type: 'setResults'; results: string[] }
    | { type: 'clearResults' }
    | { type: 'resetAll' };

const initialState: MockupState = {
    uploadedImage: null,
    selectedCategory: 'phone',
    selectedDevice: 'iPhone 15 Pro',
    selectedScene: 'minimal',
    angle: 0,
    shadow: 50,
    isGenerating: false,
    results: [],
};

const normalizeMockupSnapshot = (value: unknown): Partial<MockupSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        selectedCategory: typeof snapshot.selectedCategory === 'string' ? snapshot.selectedCategory : initialState.selectedCategory,
        selectedDevice: typeof snapshot.selectedDevice === 'string' ? snapshot.selectedDevice : initialState.selectedDevice,
        selectedScene: typeof snapshot.selectedScene === 'string' ? snapshot.selectedScene : initialState.selectedScene,
        angle: typeof snapshot.angle === 'number' ? snapshot.angle : initialState.angle,
        shadow: typeof snapshot.shadow === 'number' ? snapshot.shadow : initialState.shadow,
        results: Array.isArray(snapshot.results) ? snapshot.results.filter((item): item is string => typeof item === 'string') : initialState.results,
    };
};

function reducer(state: MockupState, action: MockupAction): MockupState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setCategory':
            return { ...state, selectedCategory: action.selectedCategory, selectedDevice: action.selectedDevice };
        case 'setDevice':
            return { ...state, selectedDevice: action.selectedDevice };
        case 'setScene':
            return { ...state, selectedScene: action.selectedScene };
        case 'setAngle':
            return { ...state, angle: action.angle };
        case 'setShadow':
            return { ...state, shadow: action.shadow };
        case 'setGenerating':
            return { ...state, isGenerating: action.isGenerating };
        case 'setResults':
            return { ...state, results: action.results };
        case 'clearResults':
            return { ...state, results: [] };
        case 'resetAll':
            return initialState;
        default:
            return state;
    }
}

export default function MockupGeneratorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <MockupGeneratorPageContent />
        </Suspense>
    );
}

function MockupGeneratorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const { mockupGenerator, currentGeneration, error, reset } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const uploaded = await mediaApi.uploadMedia(file);
            if (!uploaded?.url) {
                toast.error('Failed to upload image');
                return;
            }
            dispatch({ type: 'setUploadedImage', uploadedImage: uploaded.url });
            dispatch({ type: 'clearResults' });
        }
    };

    const handleGenerate = async () => {
        if (!state.uploadedImage) return;
        dispatch({ type: 'setGenerating', isGenerating: true });
        dispatch({ type: 'clearResults' });
        try {
            await mockupGenerator({
                designUrl: state.uploadedImage,
                template: state.selectedCategory,
                prompt: `${state.selectedDevice} mockup in ${state.selectedScene} scene`,
                scene: state.selectedScene,
            });
        } finally {
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    };

    const handleReset = () => {
        reset();
        dispatch({ type: 'resetAll' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setProjectError(null);
    };

    const downloadMockup = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
    };

    const handleSaveAll = () => {
        const payload: MockupProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                uploadedImage: state.uploadedImage,
                selectedCategory: state.selectedCategory,
                selectedDevice: state.selectedDevice,
                selectedScene: state.selectedScene,
                angle: state.angle,
                shadow: state.shadow,
                results: state.results,
            },
        };

        localStorage.setItem('mockup-generator:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Mockup Generator Draft',
                        description: 'Mockup generator draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Mockup Generator Draft',
                        description: 'Mockup generator draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Mockup saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist mockup project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExportAll = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uploadedImage: state.uploadedImage,
            selectedCategory: state.selectedCategory,
            selectedDevice: state.selectedDevice,
            selectedScene: state.selectedScene,
            angle: state.angle,
            shadow: state.shadow,
            results: state.results,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mockup-generator-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Mockup export created.');
    };

    const currentCategory = mockupCategories.find((category) => category.id === state.selectedCategory);

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = (snapshot: Partial<MockupSnapshot>) => {
            dispatch({ type: 'setUploadedImage', uploadedImage: snapshot.uploadedImage ?? null });
            dispatch({ type: 'setCategory', selectedCategory: snapshot.selectedCategory ?? initialState.selectedCategory, selectedDevice: snapshot.selectedDevice ?? initialState.selectedDevice });
            dispatch({ type: 'setScene', selectedScene: snapshot.selectedScene ?? initialState.selectedScene });
            dispatch({ type: 'setAngle', angle: snapshot.angle ?? initialState.angle });
            dispatch({ type: 'setShadow', shadow: snapshot.shadow ?? initialState.shadow });
            dispatch({ type: 'setResults', results: snapshot.results ?? initialState.results });
        };

        const loadProject = async () => {
            const draftRaw = localStorage.getItem('mockup-generator:draft:v1');

            if (!projectId) {
                try {
                    if (draftRaw) {
                        hydrate(normalizeMockupSnapshot(JSON.parse(draftRaw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore mockup draft', loadError);
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
                    hydrate(normalizeMockupSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore mockup project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved mockup project. Falling back to a local draft.');
                    try {
                        if (draftRaw) {
                            hydrate(normalizeMockupSnapshot(JSON.parse(draftRaw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore mockup fallback', fallbackError);
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

    useEffect(() => {
        if (!currentGeneration || currentGeneration.type !== 'mockup') {
            return;
        }

        if (currentGeneration.status === 'completed' && currentGeneration.resultUrl) {
            dispatch({ type: 'setResults', results: [currentGeneration.resultUrl] });
            dispatch({ type: 'setGenerating', isGenerating: false });
        } else if (currentGeneration.status === 'failed') {
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    }, [currentGeneration]);

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Mockup Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Your Screenshot</h4>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                        >
                            {state.uploadedImage ? (
                                <Image src={state.uploadedImage} alt="Screenshot" fill className="object-contain" sizes="(max-width: 768px) 100vw, 320px" />
                            ) : (
                                <>
                                    <div className="size-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                        <Upload className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium">Upload Screenshot</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">App or website screenshot</p>
                                    </div>
                                </>
                            )}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Device</h4>
                        <div className="grid grid-cols-5 gap-1.5">
                            {mockupCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => dispatch({ type: 'setCategory', selectedCategory: category.id, selectedDevice: category.items[0] })}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                                        state.selectedCategory === category.id ? 'bg-accent border-primary/20' : 'bg-card border-border',
                                    )}
                                >
                                    <category.icon className="size-4" />
                                    <span className="text-[8px] font-medium">{category.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {currentCategory?.items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => dispatch({ type: 'setDevice', selectedDevice: item })}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.selectedDevice === item ? 'bg-accent border border-primary/20' : 'bg-card border border-border',
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Scene</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {scenes.map((scene) => (
                                <button
                                    key={scene.id}
                                    onClick={() => dispatch({ type: 'setScene', selectedScene: scene.id })}
                                    className={cn(
                                        'p-2.5 rounded-xl border transition-all text-left',
                                        state.selectedScene === scene.id ? 'bg-accent border-primary/20' : 'bg-card border-border',
                                    )}
                                >
                                    <p className="text-[10px] font-medium">{scene.label}</p>
                                    <p className="text-[8px] text-muted-foreground">{scene.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Rotation Angle</Label>
                                <span className="text-[11px] font-mono">{state.angle}°</span>
                            </div>
                            <Slider min={-45} max={45} step={5} value={[state.angle]} onValueChange={([v]) => dispatch({ type: 'setAngle', angle: v })} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Shadow</Label>
                                <span className="text-[11px] font-mono">{state.shadow}%</span>
                            </div>
                            <Slider min={0} max={100} step={5} value={[state.shadow]} onValueChange={([v]) => dispatch({ type: 'setShadow', shadow: v })} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleReset} disabled={isProjectBusy}>
                        Reset form
                    </Button>
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">2 Credits</span>
                    </div>
                    {(currentGeneration?.status === 'failed' || error) && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {currentGeneration?.error || error || 'Mockup generation failed. Please try again.'}
                        </div>
                    )}
                    <Button onClick={handleGenerate} disabled={state.isGenerating || isProjectBusy || !state.uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {state.isGenerating ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Generating?
                            </>
                        ) : (
                            <>
                                <Box className="size-5" />
                                Generate Mockups
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {state.results.length > 0 && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                        <span className="text-sm font-medium">{state.selectedDevice} • {scenes.find((scene) => scene.id === state.selectedScene)?.label}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveAll} disabled={isProjectBusy}><Folder className="size-4" /> {isProjectSaving ? 'Saving...' : 'Save All'}</Button>
                            <Button size="sm" className="gap-2" onClick={handleExportAll}><Download className="size-4" /> Export All</Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-8">
                    {state.isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative">
                                <div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <Box className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm text-muted-foreground animate-pulse">Generating mockups?</p>
                        </div>
                    ) : state.results.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {state.results.map((url, index) => (
                                <div key={url} className="group relative rounded-2xl border border-border overflow-hidden shadow-lg bg-card">
                                    <div className="relative w-full aspect-video">
                                        <Image src={url} alt={`Mockup ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                                    </div>
                                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" className="gap-2" onClick={() => downloadMockup(url, `mockup-${index + 1}.png`)}><Download className="size-4" /> Download</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                <Box className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Create Product Mockups</h3>
                                <p className="text-sm text-muted-foreground mt-1">Upload a screenshot and choose a device to create professional mockups</p>
                            </div>
                        </div>
                    )}
                    {projectError && (
                        <p className="mt-4 text-sm text-amber-500/90 text-center">{projectError}</p>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
