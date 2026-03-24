'use client';

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/ui/select';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import {
    Upload,
    Sparkles,
    Info,
    History,
    Download,
    Settings,
    Loader2,
    Image as ImageIcon,
    Target,
    Grid3X3,
    Clock,
    Repeat,
    FileText,
    Video,
    Save,
    ChevronDown,
    Folder
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import {
    UpscaleMode,
    UpscaleModel,
    UpscaleScale,
    UpscaleOptimization,
    UpscaleEngine,
    UpscaleParams
} from '@/types/upscaler';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { MediaItem } from '@/types/media';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { PersonalGallery } from '@/components/upscaler/PersonalGallery';
import { post } from '@/lib/api'; // Import post helper

const PRESETS = [
    { label: 'Subtle', value: 'subtle' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'Strong', value: 'strong' },
    { label: 'Creative', value: 'creative' },
];

export default function ImageUpscalerPage() {
    const { upscaleImage, isGenerating, currentGeneration, reset } = useGenerationStore();
    const [params, setParams] = useState<UpscaleParams>({
        mode: UpscaleMode.CREATIVE,
        model: UpscaleModel.MAGNIFIC,
        scale: UpscaleScale.X2,
        optimization: UpscaleOptimization.STANDARD_ULTRA,
        creativity: -3,
        hdr: 0,
        resemblance: 5,
        fractality: 0,
        engine: UpscaleEngine.AUTOMATIC,
        prompt: ''
    });

    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [localUpscaledImage, setLocalUpscaledImage] = useState<string | null>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync store state with local state
    useEffect(() => {
        if (currentGeneration?.status === 'completed' && currentGeneration.resultUrl) {
            setLocalUpscaledImage(currentGeneration.resultUrl);
        }
    }, [currentGeneration]);

    const updateParam = <K extends keyof UpscaleParams>(key: K, value: UpscaleParams[K]) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectImage = (media: MediaItem) => {
        setUploadedImage(media.url);
        setLocalUpscaledImage(null);
        reset(); // Reset previous generation
        setIsMediaModalOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedImage(url);
            setLocalUpscaledImage(null);
            reset();
        }
    };

    const handleUpscale = async () => {
        if (!uploadedImage) return;

        let imageUrlToUse = uploadedImage;

        // If it's a local blob URL (new upload), upload it first
        if (uploadedImage.startsWith('blob:')) {
            try {
                const formData = new FormData();
                // We need to convert the blob URL back to a File object or use the fileInputRef if available.
                // Since we don't persist the File object in state, let's fetch the blob and create a File.
                const response = await fetch(uploadedImage);
                const blob = await response.blob();
                const file = new File([blob], "image.png", { type: blob.type });

                formData.append('file', file);

                // Use the configured API client (axios) which handles auth headers
                // We need to import 'api' from '@/lib/api' or use fetch with token.
                // Assuming 'api' is available or we use a direct fetch with session token if needed.
                // Better: Use the api helper. 
                // But api.post returns data, not full response. 
                // Let's import { post } from '@/lib/api' and use that.

                // We need to cast the response because our api wrapper types might be generic
                const uploadResult = await post<{ path: string }>('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (uploadResult && uploadResult.path) {
                    imageUrlToUse = uploadResult.path;
                } else {
                    throw new Error("Upload failed: No path returned");
                }
            } catch (error) {
                console.error("Failed to upload image:", error);
                // Optionally set error state here using store or local state
                return;
            }
        }

        await upscaleImage({
            imageUrl: imageUrlToUse,
            scale: Number(params.scale) || 2,
            creativity: params.creativity,
            hdr: params.hdr,
            resemblance: params.resemblance
        });
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[340px] border-r border-border flex flex-col shrink-0 bg-background">
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-muted-foreground">Image Upscaler</h2>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* ... (Keep existing control content) ... */}
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 p-1 bg-muted rounded-xl border border-border">
                        <button
                            onClick={() => updateParam('mode', UpscaleMode.CREATIVE)}
                            className={cn(
                                "py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                params.mode === UpscaleMode.CREATIVE
                                    ? "bg-background text-foreground shadow-lg border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Creative
                        </button>
                        <button
                            onClick={() => updateParam('mode', UpscaleMode.PRECISION)}
                            className={cn(
                                "py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                params.mode === UpscaleMode.PRECISION
                                    ? "bg-background text-foreground shadow-lg border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Precision
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div
                            onClick={triggerUpload}
                            className="group relative aspect-[4/3] rounded-2xl bg-muted border border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                        >
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-foreground">Source Image</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Drop or click here</p>
                                    </div>
                                </>
                            )}

                            {/* Library Overlay */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="w-8 h-8 rounded-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMediaModalOpen(true);
                                    }}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {/* Tool Parameters */}
                    <div className="space-y-6">
                        {/* Model & Preset Row */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Model
                                </Label>
                                <Select
                                    value={params.model}
                                    onValueChange={(val) => updateParam('model', val as UpscaleModel)}
                                >
                                    <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UpscaleModel).map(m => (
                                            <SelectItem key={m} value={m}>
                                                {m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Presets</Label>
                                <Select defaultValue="subtle">
                                    <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                        <SelectValue placeholder="Select preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESETS.map(p => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Scale & Optimized For Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Scale Factor</Label>
                                <Select
                                    value={params.scale.toString()}
                                    onValueChange={(val) => updateParam('scale', Number(val) as UpscaleScale)}
                                >
                                    <SelectTrigger className="w-full h-10 bg-muted border-border rounded-xl px-3 text-xs font-bold">
                                        <SelectValue placeholder="Scale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2x</SelectItem>
                                        <SelectItem value="4">4x</SelectItem>
                                        <SelectItem value="8">8x</SelectItem>
                                        <SelectItem value="16">16x</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Optimized For</Label>
                                <Select
                                    value={params.optimization}
                                    onValueChange={(val) => updateParam('optimization', val as UpscaleOptimization)}
                                >
                                    <SelectTrigger className="w-full h-10 bg-muted border-border rounded-xl px-3 text-xs font-bold">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UpscaleOptimization).map(o => (
                                            <SelectItem key={o} value={o}>
                                                {o.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sliders Section */}
                        <div className="space-y-5 pt-2">
                            {/* Creativity Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Creativity</span>
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.creativity}</span>
                                </div>
                                <Slider
                                    min={-10} max={10} step={1}
                                    value={[params.creativity]}
                                    onValueChange={([val]) => updateParam('creativity', val)}
                                />
                            </div>

                            {/* HDR Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HDR</span>
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.hdr}</span>
                                </div>
                                <Slider
                                    min={0} max={10} step={1}
                                    value={[params.hdr]}
                                    onValueChange={([val]) => updateParam('hdr', val)}
                                />
                            </div>

                            {/* Resemblance Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resemblance</span>
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.resemblance}</span>
                                </div>
                                <Slider
                                    min={0} max={10} step={1}
                                    value={[params.resemblance]}
                                    onValueChange={([val]) => updateParam('resemblance', val)}
                                />
                            </div>
                        </div>

                        {/* Engine Selection */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Engine</Label>
                            <Select
                                value={params.engine}
                                onValueChange={(val) => updateParam('engine', val as UpscaleEngine)}
                            >
                                <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                    <SelectValue placeholder="Select engine" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UpscaleEngine.AUTOMATIC}>Automatic Stable</SelectItem>
                                    <SelectItem value={UpscaleEngine.ENGINE_V1}>High Performance V1</SelectItem>
                                    <SelectItem value={UpscaleEngine.ENGINE_V2}>Extreme Detail V2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Prompt Guidance */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Prompt Guidance</Label>
                            <textarea
                                placeholder="Describe details to enhance..."
                                value={params.prompt}
                                onChange={(e) => updateParam('prompt', e.target.value)}
                                className="w-full h-24 bg-muted border border-border rounded-xl p-3 text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Upscale Action - Pinned to Sidebar Bottom */}
                <div className="p-4 border-t border-border bg-background">
                    <Button
                        onClick={handleUpscale}
                        disabled={isGenerating || !uploadedImage}
                        className="w-full h-12 font-bold rounded-xl gap-2 shadow-sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Upscaling...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Upscale
                            </>
                        )}
                    </Button>
                </div>
            </div>



            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col bg-background relative min-w-0">
                {/* Post-Upscale Header */}
                {(localUpscaledImage || currentGeneration?.status === 'completed') && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mr-auto text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Just now</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <Repeat className="w-4 h-4" />
                                    Reuse
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Reuse Image As</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <FileText className="w-4 h-4 mr-2" />
                                    <span>Prompt</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Get prompt</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Repeat className="w-4 h-4 mr-2" />
                                    <span>Reimagine</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Variations</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    <span>Style Reference</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Video className="w-4 h-4 mr-2" />
                                    <span>Video</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Img2Vid</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" size="sm" className="gap-2">
                            <Folder className="w-4 h-4" />
                            Save
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                )}

                {/* Content Area with Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Show Gallery until the Upscaled Result is ready */}
                    {!localUpscaledImage && (
                        <PersonalGallery />
                    )}

                    {/* Show Result only when Upscaled Image is available */}
                    {localUpscaledImage && (
                        <div className="flex-1 flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                            <ReactCompareSlider
                                itemOne={
                                    <ReactCompareSliderImage
                                        src={uploadedImage || ''}
                                        alt="Original"
                                    />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage
                                        src={localUpscaledImage}
                                        alt="Upscaled"
                                    />
                                }
                                position={50}
                                className="rounded-xl overflow-hidden border border-border shadow-2xl max-h-[80vh] w-auto h-full"
                            />
                        </div>
                    )}
                </div>
            </div>

            <MediaPickerModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onSelect={handleSelectImage}
                mediaType="image"
            />
        </div>
    );
}
