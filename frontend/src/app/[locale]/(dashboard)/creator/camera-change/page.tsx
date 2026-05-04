'use client';

import Image from 'next/image';
import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
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

type CameraChangeAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setSelectedAngle'; selectedAngle: string }
    | { type: 'setFocalLength'; focalLength: string }
    | { type: 'setRotation'; rotation: number }
    | { type: 'setTilt'; tilt: number }
    | { type: 'setZoom'; zoom: number }
    | { type: 'setDof'; dof: number };

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
        default:
            return state;
    }
}

export default function CameraChangePage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { cameraChange, currentGeneration, reset, isGenerating } = useGenerationStore();
    const resultImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const isProcessing = isGenerating;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            dispatch({ type: 'setUploadedImage', uploadedImage: URL.createObjectURL(file) });
        }
    };

    const handleProcess = async () => {
        if (!state.uploadedImage) return;
        await cameraChange({
            imageUrl: state.uploadedImage,
            movement: state.selectedAngle,
            angle: state.rotation,
            prompt: `Camera angle: ${state.selectedAngle}, focal length: ${state.focalLength}, tilt: ${state.tilt}°, zoom: ${state.zoom}%`,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-muted-foreground">Camera Change</h2>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" /> New
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
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
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Camera Angle</h4>
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
                                    <angle.icon className="w-4 h-4" />
                                    <span className="text-[9px] font-medium truncate w-full text-center">{angle.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Focal Length</h4>
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
                                <span className="text-[11px] font-mono text-foreground">{state.rotation}°</span>
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
                                <span className="text-[11px] font-mono text-foreground">{state.tilt}°</span>
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
                    <Button onClick={handleProcess} disabled={isProcessing || !state.uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Camera className="w-5 h-5" />
                                Change Camera
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={() => reset()}>
                            <RotateCcw className="w-4 h-4" /> Reset
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Folder className="w-4 h-4" /> Save
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download className="w-4 h-4" /> Export
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
                                <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                                    <Camera className="w-8 h-8 text-muted-foreground" />
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
                                        <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                        <Camera className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Changing perspective...</p>
                                </div>
                            ) : resultImage ? (
                                <div className="relative h-[65vh] w-full max-w-4xl rounded-xl border border-border shadow-lg overflow-hidden">
                                    <Image src={resultImage} alt="Result" fill className="object-contain" sizes="100vw" />
                                </div>
                            ) : (
                                <div className="w-full max-w-md aspect-[4/3] rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Target className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">Select angle and click &quot;Change Camera&quot;</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
