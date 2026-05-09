'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import {
    Camera,
    Upload,
    Download,
    Sparkles,
    Loader2,
    RotateCcw,
    MoveUp,
    MoveDown,
    ZoomIn,
    Folder,
    ArrowLeft,
    ArrowRight,
    Target,
    Maximize,
    Bird,
    ScanSearch,
    Focus,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const cameraAngles = [
    { id: 'front', label: 'Front View', icon: Target },
    { id: 'side-left', label: 'Left Side', icon: ArrowLeft },
    { id: 'side-right', label: 'Right Side', icon: ArrowRight },
    { id: 'top-down', label: 'Top Down', icon: MoveDown },
    { id: 'low-angle', label: 'Low Angle', icon: MoveUp },
    { id: 'birds-eye', label: "Bird's Eye", icon: Bird },
    { id: '3-quarter', label: '3/4 View', icon: Maximize },
    { id: 'back', label: 'Back View', icon: RotateCcw },
    { id: 'dutch', label: 'Dutch Angle', icon: Focus },
    { id: 'close-up', label: 'Close Up', icon: ZoomIn },
    { id: 'wide', label: 'Wide Shot', icon: Camera },
    { id: 'macro', label: 'Macro', icon: ScanSearch },
];

const focalLengths = [
    { value: '14mm', label: '14mm Ultra Wide' },
    { value: '24mm', label: '24mm Wide' },
    { value: '35mm', label: '35mm Standard' },
    { value: '50mm', label: '50mm Normal' },
    { value: '85mm', label: '85mm Portrait' },
    { value: '135mm', label: '135mm Telephoto' },
    { value: '200mm', label: '200mm Super Tele' },
];

type CameraChangeState = {
    uploadedImage: string | null;
    selectedAngle: string;
    focalLength: string;
    rotation: number;
    tilt: number;
    zoom: number;
    dof: number;
};

type CameraChangeSnapshot = {
    uploadedImage: string | null;
    resultImage: string | null;
    selectedAngle: string;
    focalLength: string;
    rotation: number;
    tilt: number;
    zoom: number;
    dof: number;
};

type CameraChangeProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<CameraChangeSnapshot>;
};

const normalizeCameraChangeSnapshot = (value: unknown): Partial<CameraChangeSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        resultImage: typeof snapshot.resultImage === 'string' ? snapshot.resultImage : null,
        selectedAngle: typeof snapshot.selectedAngle === 'string' ? snapshot.selectedAngle : initialState.selectedAngle,
        focalLength: typeof snapshot.focalLength === 'string' ? snapshot.focalLength : initialState.focalLength,
        rotation: typeof snapshot.rotation === 'number' ? snapshot.rotation : initialState.rotation,
        tilt: typeof snapshot.tilt === 'number' ? snapshot.tilt : initialState.tilt,
        zoom: typeof snapshot.zoom === 'number' ? snapshot.zoom : initialState.zoom,
        dof: typeof snapshot.dof === 'number' ? snapshot.dof : initialState.dof,
    };
};

type CameraChangeAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setSelectedAngle'; selectedAngle: string }
    | { type: 'setFocalLength'; focalLength: string }
    | { type: 'setRotation'; rotation: number }
    | { type: 'setTilt'; tilt: number }
    | { type: 'setZoom'; zoom: number }
    | { type: 'setDof'; dof: number }
    | { type: 'reset' };

const initialState: CameraChangeState = {
    uploadedImage: null,
    selectedAngle: 'front',
    focalLength: '50mm',
    rotation: 0,
    tilt: 0,
    zoom: 100,
    dof: 0,
};

function reducer(state: CameraChangeState, action: CameraChangeAction): CameraChangeState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setSelectedAngle':
            return { ...state, selectedAngle: action.selectedAngle };
        case 'setFocalLength':
            return { ...state, focalLength: action.focalLength };
        case 'setRotation':
            return { ...state, rotation: action.rotation };
        case 'setTilt':
            return { ...state, tilt: action.tilt };
        case 'setZoom':
            return { ...state, zoom: action.zoom };
        case 'setDof':
            return { ...state, dof: action.dof };
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function CameraChangePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <CameraChangePageContent />
        </Suspense>
    );
}

function CameraChangePageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [restoredResultImage, setRestoredResultImage] = useState<string | null>(null);
    const { cameraChange, currentGeneration, reset, isGenerating } = useGenerationStore();
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

        const hydrateFromSnapshot = (snapshot: Partial<CameraChangeSnapshot>) => {
            dispatch({ type: 'setUploadedImage', uploadedImage: snapshot.uploadedImage ?? null });
            dispatch({ type: 'setSelectedAngle', selectedAngle: snapshot.selectedAngle ?? initialState.selectedAngle });
            dispatch({ type: 'setFocalLength', focalLength: snapshot.focalLength ?? initialState.focalLength });
            dispatch({ type: 'setRotation', rotation: snapshot.rotation ?? initialState.rotation });
            dispatch({ type: 'setTilt', tilt: snapshot.tilt ?? initialState.tilt });
            dispatch({ type: 'setZoom', zoom: snapshot.zoom ?? initialState.zoom });
            dispatch({ type: 'setDof', dof: snapshot.dof ?? initialState.dof });
            setRestoredResultImage(snapshot.resultImage ?? null);
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const raw = localStorage.getItem('camera-change:draft:v1');
                    if (raw) {
                        hydrateFromSnapshot(normalizeCameraChangeSnapshot(JSON.parse(raw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore camera change draft', loadError);
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
                    hydrateFromSnapshot(normalizeCameraChangeSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore camera change project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved camera change project. Falling back to a local draft.');
                    try {
                        const draftKey = 'camera-change:draft:v1';
                        const raw = localStorage.getItem(draftKey);
                        if (raw) {
                            hydrateFromSnapshot(normalizeCameraChangeSnapshot(JSON.parse(raw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore camera change fallback', fallbackError);
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

    const handleProcess = async () => {
        if (!state.uploadedImage) return;
        try {
            await cameraChange({
                imageUrl: state.uploadedImage,
                movement: state.selectedAngle,
                angle: state.rotation,
                prompt: `Camera angle: ${state.selectedAngle}, focal length: ${state.focalLength}, tilt: ${state.tilt}°, zoom: ${state.zoom}%`,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to change camera perspective');
        }
    };

    const handleSave = () => {
        const payload: CameraChangeProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                uploadedImage: state.uploadedImage,
                resultImage,
                selectedAngle: state.selectedAngle,
                focalLength: state.focalLength,
                rotation: state.rotation,
                tilt: state.tilt,
                zoom: state.zoom,
                dof: state.dof,
            },
        };

        localStorage.setItem('camera-change:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Camera Change Draft',
                        description: 'Camera change draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Camera Change Draft',
                        description: 'Camera change draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Camera change saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist camera change project', saveError);
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
                selectedAngle: state.selectedAngle,
                focalLength: state.focalLength,
                rotation: state.rotation,
                tilt: state.tilt,
                zoom: state.zoom,
                dof: state.dof,
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'camera-change-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Camera change export created.');
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
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Camera Change</h2>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold">
                        <Sparkles className="size-2.5" /> New
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">
                        {isProjectLoading ? 'Loading project...' : projectError ?? ''}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                        aria-label="Upload image"
                    >
                        {state.uploadedImage ? (
                            <div className="relative h-full w-full">
                                <Image src={state.uploadedImage} alt="Preview" fill className="object-contain" sizes="320px" />
                            </div>
                        ) : (
                            <>
                                <div className="size-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Upload className="size-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Upload Image</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Upload the image to change perspective</p>
                                </div>
                            </>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Camera Angle</h4>
                        <div className="grid grid-cols-3 gap-1.5">
                            {cameraAngles.map((angle) => (
                                <button
                                    key={angle.id}
                                    onClick={() => dispatch({ type: 'setSelectedAngle', selectedAngle: angle.id })}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all',
                                        state.selectedAngle === angle.id
                                            ? 'bg-accent border-primary/20 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-border/80',
                                    )}
                                >
                                    <angle.icon className="size-4" />
                                    <span className="text-[9px] font-medium truncate w-full text-center">{angle.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Focal Length</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {focalLengths.map((fl) => (
                                <button
                                    key={fl.value}
                                    onClick={() => dispatch({ type: 'setFocalLength', focalLength: fl.value })}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.focalLength === fl.value
                                            ? 'bg-accent border border-primary/20 text-foreground'
                                            : 'bg-card border border-border text-muted-foreground',
                                    )}
                                >
                                    {fl.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Rotation</Label>
                                <span className="text-[11px] font-mono text-foreground">{state.rotation}Â°</span>
                            </div>
                            <Slider
                                min={-180}
                                max={180}
                                step={5}
                                value={[state.rotation]}
                                onValueChange={([value]) => dispatch({ type: 'setRotation', rotation: value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Tilt</Label>
                                <span className="text-[11px] font-mono text-foreground">{state.tilt}Â°</span>
                            </div>
                            <Slider
                                min={-90}
                                max={90}
                                step={5}
                                value={[state.tilt]}
                                onValueChange={([value]) => dispatch({ type: 'setTilt', tilt: value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Zoom</Label>
                                <span className="text-[11px] font-mono text-foreground">{state.zoom}%</span>
                            </div>
                            <Slider
                                min={50}
                                max={200}
                                step={5}
                                value={[state.zoom]}
                                onValueChange={([value]) => dispatch({ type: 'setZoom', zoom: value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Depth of Field</Label>
                                <span className="text-[11px] font-mono text-foreground">{state.dof}</span>
                            </div>
                            <Slider
                                min={0}
                                max={100}
                                step={5}
                                value={[state.dof]}
                                onValueChange={([value]) => dispatch({ type: 'setDof', dof: value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">2 Credits</span>
                    </div>
                    <Button onClick={handleProcess} disabled={isProcessing || !state.uploadedImage || isProjectLoading || isProjectSaving} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Processing?
                            </>
                        ) : (
                            <>
                                <Camera className="size-5" />
                                Change Camera
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={handleReset}>
                            <RotateCcw className="size-4" /> Reset
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isProjectLoading || isProjectSaving}>
                            <Folder className="size-4" /> Save
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="size-4" /> Export
                        </Button>
                    </div>
                )}
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex items-center justify-center p-6 bg-muted/10">
                        {state.uploadedImage ? (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Original</p>
                                <div className="relative h-[65vh] w-full max-w-4xl rounded-xl border border-border shadow-lg overflow-hidden">
                                    <Image src={state.uploadedImage} alt="Original" fill className="object-contain" sizes="100vw" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                                    <Camera className="size-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Change Camera Perspective</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Upload an image to transform its camera angle</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex items-center justify-center p-6 border-l border-border bg-muted/5">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</p>
                            {isProcessing ? (
                                <div className="w-full max-w-md aspect-[4/3] rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                        <Camera className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Changing perspective?</p>
                                </div>
                            ) : resultImage ? (
                                <div className="relative h-[65vh] w-full max-w-4xl rounded-xl border border-border shadow-lg overflow-hidden">
                                    <Image src={resultImage} alt="Result" fill className="object-contain" sizes="100vw" />
                                </div>
                            ) : (
                                <div className="w-full max-w-md aspect-[4/3] rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Target className="size-8 opacity-30" />
                                    <p className="text-sm">Select angle and click &quot;Change Camera&quot;</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}



