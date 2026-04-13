'use client';

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Eraser,
    Upload,
    Download,
    Sparkles,
    Loader2,
    Grid3X3,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Move,
    Eye,
    EyeOff,
    Layers,
    Folder,
    ChevronDown,
    Image as ImageIcon,
    Check
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

const bgOptions = [
    { id: 'transparent', label: 'Transparent', color: 'bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]' },
    { id: 'white', label: 'White', color: 'bg-white' },
    { id: 'black', label: 'Black', color: 'bg-black' },
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'green', label: 'Green', color: 'bg-green-500' },
    { id: 'red', label: 'Red', color: 'bg-red-500' },
    { id: 'gradient1', label: 'Gradient', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
    { id: 'gradient2', label: 'Ocean', color: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
];

const qualityModes = [
    { id: 'fast', label: 'Fast', description: 'Quick processing, good quality' },
    { id: 'balanced', label: 'Balanced', description: 'Best balance of speed & quality' },
    { id: 'quality', label: 'Quality', description: 'Highest quality, slower' },
];

export default function BgRemoverPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBg, setSelectedBg] = useState('transparent');
    const [qualityMode, setQualityMode] = useState('balanced');
    const [showOriginal, setShowOriginal] = useState(false);
    const [edgeRefinement, setEdgeRefinement] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { removeBackground, currentGeneration, error: storeError } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedImage(url);
            setResultImage(null);
        }
    };

    // Watch for completed generation result
    useEffect(() => {
        if (currentGeneration?.status === 'completed' && currentGeneration.resultUrl) {
            setResultImage(currentGeneration.resultUrl);
            setIsProcessing(false);
        } else if (currentGeneration?.status === 'failed') {
            setIsProcessing(false);
        }
    }, [currentGeneration]);

    const handleRemoveBg = async () => {
        if (!uploadedImage) return;
        setIsProcessing(true);
        setResultImage(null);
        await removeBackground({
            imageUrl: uploadedImage,
            mode: qualityMode === 'fast' ? 'auto' : qualityMode === 'quality' ? 'person' : 'auto',
            edgeRefinement: edgeRefinement ? 80 : 20,
        });
        // Result will come through currentGeneration.resultUrl via polling
        setIsProcessing(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setUploadedImage(url);
            setResultImage(null);
        }
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-muted-foreground">Background Remover</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                    >
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground">Upload Image</p>
                                    <p className="text-[11px] text-muted-foreground mt-1">Drag & drop or click to browse</p>
                                    <p className="text-[10px] text-muted-foreground/50 mt-1">PNG, JPG, WebP up to 20MB</p>
                                </div>
                            </>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Quality Mode */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Processing Mode</h4>
                        <div className="space-y-2">
                            {qualityModes.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setQualityMode(mode.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                                        qualityMode === mode.id
                                            ? "bg-accent border-primary/20 text-foreground"
                                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                        qualityMode === mode.id ? "border-primary" : "border-muted-foreground/30"
                                    )}>
                                        {qualityMode === mode.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">{mode.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{mode.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Edge Refinement */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Options</h4>
                        <button
                            onClick={() => setEdgeRefinement(!edgeRefinement)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border"
                        >
                            <span className="text-xs font-medium">Edge Refinement</span>
                            <div className={cn(
                                "w-9 h-5 rounded-full transition-colors flex items-center px-0.5",
                                edgeRefinement ? "bg-primary" : "bg-muted-foreground/20"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                                    edgeRefinement ? "translate-x-4" : "translate-x-0"
                                )} />
                            </div>
                        </button>
                    </div>

                    {/* Background Color */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Background</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {bgOptions.map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => setSelectedBg(bg.id)}
                                    className={cn(
                                        "aspect-square rounded-lg border-2 transition-all overflow-hidden",
                                        bg.color,
                                        selectedBg === bg.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/50"
                                    )}
                                    title={bg.label}
                                >
                                    {selectedBg === bg.id && (
                                        <div className="w-full h-full flex items-center justify-center bg-black/20">
                                            <Check className="w-4 h-4 text-white drop-shadow" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">1 Credit</span>
                    </div>
                    <Button
                        onClick={handleRemoveBg}
                        disabled={isProcessing || !uploadedImage}
                        className="w-full h-12 font-bold rounded-xl gap-2 shadow-sm"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Eraser className="w-5 h-5" />
                                Remove Background
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-background relative min-w-0">
                {/* Toolbar */}
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowOriginal(!showOriginal)}>
                                {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showOriginal ? 'Show Result' : 'Show Original'}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => { setResultImage(null); setUploadedImage(null); }}>
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Folder className="w-4 h-4" />
                                Save
                            </Button>
                            <Button size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export PNG
                            </Button>
                        </div>
                    </div>
                )}

                {/* Canvas Area */}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!uploadedImage && !resultImage ? (
                        <div className="text-center space-y-4 animate-in fade-in duration-500">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                                <Eraser className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Remove Image Background</h3>
                                <p className="text-sm text-muted-foreground mt-1">Upload an image to get started</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 pt-4">
                                {['Product Photos', 'Portraits', 'Logos', 'Objects'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <Sparkles className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Removing background...</p>
                                <p className="text-sm text-muted-foreground mt-1">This usually takes 3-5 seconds</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative max-w-3xl w-full animate-in fade-in zoom-in-95 duration-500">
                            <div className={cn(
                                "rounded-2xl overflow-hidden border border-border shadow-2xl",
                                selectedBg === 'transparent' ? 'bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]' : '',
                                selectedBg === 'white' ? 'bg-white' : '',
                                selectedBg === 'black' ? 'bg-black' : '',
                                selectedBg === 'blue' ? 'bg-blue-500' : '',
                                selectedBg === 'green' ? 'bg-green-500' : '',
                                selectedBg === 'red' ? 'bg-red-500' : '',
                                selectedBg === 'gradient1' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : '',
                                selectedBg === 'gradient2' ? 'bg-gradient-to-br from-cyan-400 to-blue-600' : '',
                            )}>
                                <img
                                    src={showOriginal ? uploadedImage! : (resultImage || uploadedImage!)}
                                    alt="Result"
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                />
                            </div>
                            {resultImage && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full border border-border text-xs font-medium">
                                    {showOriginal ? '🖼️ Original' : '✨ Background Removed'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
