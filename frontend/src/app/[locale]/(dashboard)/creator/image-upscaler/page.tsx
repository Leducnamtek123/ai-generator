'use client';

import { useState } from 'react';
import {
    ChevronDown,
    Upload,
    Sparkles,
    ZoomIn,
    Grid3X3,
    Download,
    Settings,
    Loader2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

const models = ['Real-ESRGAN', 'GFPGAN', 'Clarity AI', 'Ultra Sharp'];
const scales = ['2x', '4x', '8x'];

export default function ImageUpscalerPage() {
    const [selectedModel, setSelectedModel] = useState('Real-ESRGAN');
    const [selectedScale, setSelectedScale] = useState('4x');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex">
            {/* Left Control Panel */}
            <div className="w-80 border-r border-white/5 flex flex-col shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-green-400" />
                        Image Upscaler
                    </h2>
                    <p className="text-xs text-white/40 mt-1">Enhance and upscale your images with AI</p>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Upload Area */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Upload Image</h4>
                        <div className="aspect-video rounded-xl bg-[#151619] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-colors">
                            <Upload className="w-8 h-8 text-white/30 mb-2" />
                            <span className="text-sm text-white/40">Drop image here</span>
                            <span className="text-xs text-white/20 mt-1">or click to browse</span>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Model</h4>
                        <button className="flex items-center justify-between w-full px-4 py-3 bg-[#151619] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-green-400" />
                                <span className="text-sm">{selectedModel}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                    </div>

                    {/* Scale Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Scale</h4>
                        <div className="flex gap-2">
                            {scales.map((scale) => (
                                <button
                                    key={scale}
                                    onClick={() => setSelectedScale(scale)}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium rounded-lg border transition-colors",
                                        selectedScale === scale
                                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                                            : "bg-[#151619] border-white/5 text-white/60 hover:border-white/10"
                                    )}
                                >
                                    {scale}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Options</h4>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-3 bg-[#151619] rounded-lg border border-white/5">
                                <span className="text-sm text-white/70">Face Enhancement</span>
                                <input type="checkbox" className="w-4 h-4 accent-green-500" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-[#151619] rounded-lg border border-white/5">
                                <span className="text-sm text-white/70">Denoise</span>
                                <input type="checkbox" className="w-4 h-4 accent-green-500" defaultChecked />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Upscale Button */}
                <div className="p-4 border-t border-white/5">
                    <Button
                        disabled={isProcessing}
                        className={cn(
                            "w-full h-12 font-semibold rounded-xl gap-2 transition-all",
                            isProcessing ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                        )}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ZoomIn className="w-4 h-4" />
                                Upscale Image
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-32 h-32 rounded-2xl bg-[#151619] border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <ZoomIn className="w-12 h-12 text-white/20" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Upload an image to upscale</h3>
                    <p className="text-sm text-white/40 max-w-md">
                        Drop an image or click the upload area to enhance your image up to 8x resolution
                    </p>
                </div>
            </div>
        </div>
    );
}
