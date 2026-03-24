import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { toast } from 'sonner';
import {
    Type, Upload, Image as ImageIcon, Video, Scan, Sparkles,
    ArrowRight, X, Download, ExternalLink, Play, Loader2, Wand2
} from 'lucide-react';
import {
    GenerationResult,
    GenerateImageParams,
    GenerateVideoParams,
    UpscaleImageParams,
    EnhancePromptParams,
} from '@/lib/api/generations';
import {
    ImageModel, VideoModel, AspectRatio, ImageQuality, VideoDuration,
    AssistantMode, StyleEmphasis, DetailLevel, UpscaleFactor, UpscaleMode, FileMediaType
} from './types';

export interface NodePanelProps {
    nodeId: string;
    nodeData: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    isGenerating?: boolean;
    handlers?: {
        handleGenerateImage?: (params: GenerateImageParams) => Promise<GenerationResult | null>;
        handleGenerateVideo?: (params: GenerateVideoParams) => Promise<GenerationResult | null>;
        handleUpscaleImage?: (params: UpscaleImageParams) => Promise<GenerationResult | null>;
        handleEnhancePrompt?: (params: EnhancePromptParams) => Promise<string | null>;
    };
}

export function ConnectionInfo({ accepts, outputs }: { accepts: string[], outputs: string }) {
    return (
        <div className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Connections</p>
            <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                    <p className="text-white/30 text-[10px] mb-1">Accepts</p>
                    <div className="flex flex-wrap gap-1">
                        {accepts.map(a => (
                            <span key={a} className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">{a}</span>
                        ))}
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20" />
                <div className="flex-1">
                    <p className="text-white/30 text-[10px] mb-1">Outputs</p>
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">{outputs}</span>
                </div>
            </div>
        </div>
    );
}

// --- Specific Panel Components ---

export function TextNodePanel({ nodeData, onChange }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Type className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-green-300 font-medium">Text Prompt</p>
                        <p className="text-[10px] text-green-300/60 mt-1">
                            Enter a description that will be used to generate images or videos.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Prompt Text</label>
                <textarea
                    value={(nodeData.text as string) || ''}
                    onChange={(e) => onChange('text', e.target.value)}
                    className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 resize-none"
                    placeholder="Describe what you want to create..."
                />
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/30">{((nodeData.text as string) || '').length} characters</p>
                    <button onClick={() => onChange('text', '')} className="text-[10px] text-white/40 hover:text-white transition-colors">
                        Clear
                    </button>
                </div>
            </div>

            <ConnectionInfo accepts={['None (Input Node)']} outputs="Text Prompt" />

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Quick Starters</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Portrait photo of a person', 'Beautiful landscape scene', 'Professional product shot', 'Abstract art composition'].map((p) => (
                        <Button
                            key={p}
                            variant="outline"
                            onClick={() => onChange('text', p)}
                            className="h-auto py-2 bg-white/5 hover:bg-white/10 border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors justify-start text-left whitespace-normal"
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Style Presets</label>
                <div className="flex flex-wrap gap-2">
                    {['Photorealistic', 'Cinematic', 'Anime', 'Digital Art', '3D Render', 'Watercolor'].map((style) => (
                        <Button
                            key={style}
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange('text', `${(nodeData.text as string) || ''}, ${style.toLowerCase()} style`)}
                            className="h-7 px-2 bg-white/5 hover:bg-green-500/20 hover:text-green-400 rounded text-[10px] text-white/60 transition-colors"
                        >
                            {style}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function MediaNodePanel({ nodeData, onChange }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-cyan-300 font-medium">Media Upload</p>
                        <p className="text-[10px] text-cyan-300/60 mt-1">
                            Upload images or videos to use in your workflow.
                        </p>
                    </div>
                </div>
            </div>

            <ConnectionInfo accepts={['None (Input Node)']} outputs="Image/Video" />

            {(nodeData.mediaUrl as string) && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Current Media</label>
                    <div className="p-3 bg-black/20 rounded-lg space-y-2">
                        <p className="text-xs text-white truncate">{(nodeData.mediaName as string) || ''}</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1 gap-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                <ExternalLink className="w-3 h-3" /> Open
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 gap-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                <Download className="w-3 h-3" /> Download
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { onChange('mediaUrl', ''); onChange('mediaName', ''); }}
                                className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors p-0"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Media Type Filter</label>
                <div className="grid grid-cols-3 gap-2">
                    {[FileMediaType.ANY, FileMediaType.IMAGE, FileMediaType.VIDEO].map((type) => (
                        <Button
                            key={type}
                            variant={(nodeData.mediaType || FileMediaType.ANY) === type ? 'default' : 'outline'}
                            onClick={() => onChange('mediaType', type)}
                            className={cn(
                                "h-9 text-xs font-medium capitalize",
                                (nodeData.mediaType || FileMediaType.ANY) === type ? "bg-cyan-600 hover:bg-cyan-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Max File Size</label>
                <select
                    value={(nodeData.maxSize as string) || '10mb'}
                    onChange={(e) => onChange('maxSize', e.target.value)}
                    className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
                >
                    <option value="5mb" className="bg-[#1A1B1F]">5 MB</option>
                    <option value="10mb" className="bg-[#1A1B1F]">10 MB</option>
                    <option value="25mb" className="bg-[#1A1B1F]">25 MB</option>
                    <option value="50mb" className="bg-[#1A1B1F]">50 MB</option>
                </select>
            </div>
        </div>
    );
}

export function ImageGenNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-blue-300 font-medium">Image Generator</p>
                        <p className="text-[10px] text-blue-300/60 mt-1">
                            Generate high-quality images from text prompts.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">AI Model</label>
                <select
                    value={(nodeData.model as string) || 'seedream'}
                    onChange={(e) => onChange('model', e.target.value)}
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none"
                >
                    <option value="seedream">Seedream 4 4K ⭐</option>
                    <option value="flux">Flux Schnell</option>
                    <option value="imagen3">Google Imagen 3</option>
                    <option value="midjourney">Midjourney v6</option>
                    <option value="dalle3">DALL-E 3</option>
                    <option value="stable">Stable Diffusion XL</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                    {['1:1', '4:3', '16:9', '9:16'].map((ratio) => (
                        <Button
                            key={ratio}
                            variant={(nodeData.aspectRatio || '1:1') === ratio ? 'default' : 'outline'}
                            onClick={() => onChange('aspectRatio', ratio)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.aspectRatio || '1:1') === ratio ? "bg-blue-600 hover:bg-blue-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {ratio}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Quality</label>
                <div className="grid grid-cols-3 gap-2">
                    {['standard', 'hd', '4k'].map((quality) => (
                        <button
                            key={quality}
                            onClick={() => onChange('quality', quality)}
                            className={`p-2 rounded-lg text-xs font-medium uppercase transition-all ${(nodeData.quality || 'hd') === quality ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                            {quality}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Negative Prompt (Optional)</label>
                <textarea
                    value={(nodeData.negativePrompt as string) || ''}
                    onChange={(e) => onChange('negativePrompt', e.target.value)}
                    className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                    placeholder="What to avoid in generation..."
                />
            </div>

            <ConnectionInfo accepts={['Text', 'Enhanced Text']} outputs="Image" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string) || 'A beautiful landscape';
                        if (handlers?.handleGenerateImage) {
                            const result = await handlers.handleGenerateImage({
                                prompt,
                                model: (nodeData.model as ImageModel) || ImageModel.SEEDREAM,
                                aspectRatio: (nodeData.aspectRatio as AspectRatio) || AspectRatio.SQUARE,
                                quality: (nodeData.quality as ImageQuality) || ImageQuality.HD,
                                negativePrompt: nodeData.negativePrompt as string,
                            });
                            if (result) {
                                onChange('generationId', result.id);
                                onChange('status', result.status);
                                toast.success('Generation started');
                            }
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
            </div>

            {(nodeData.usedPrompt as string) && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Last Used Prompt</label>
                    <div className="p-3 bg-black/20 rounded-lg text-xs text-white/60 max-h-20 overflow-y-auto">
                        {nodeData.usedPrompt as string}
                    </div>
                </div>
            )}
        </div>
    );
}

export function VideoGenNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Video className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-purple-300 font-medium">Video Generator</p>
                        <p className="text-[10px] text-purple-300/60 mt-1">Generate AI videos from text or images.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Video Model</label>
                <select
                    value={(nodeData.model as string) || VideoModel.RUNWAY}
                    onChange={(e) => onChange('model', e.target.value)}
                    className="w-full h-11 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none"
                >
                    <option value={VideoModel.RUNWAY} className="bg-[#1A1B1F]">Runway Gen-3 ⭐</option>
                    <option value={VideoModel.SORA} className="bg-[#1A1B1F]">OpenAI Sora</option>
                    <option value={VideoModel.PIKA} className="bg-[#1A1B1F]">Pika Labs</option>
                    <option value={VideoModel.KLING} className="bg-[#1A1B1F]">Kling AI</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                    {[VideoDuration.FOUR_S, VideoDuration.EIGHT_S, VideoDuration.SIXTEEN_S, VideoDuration.TWENTY_FOUR_S].map((duration) => (
                        <Button
                            key={duration}
                            variant={(nodeData.duration || VideoDuration.EIGHT_S) === duration ? 'default' : 'outline'}
                            onClick={() => onChange('duration', duration)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.duration || VideoDuration.EIGHT_S) === duration ? "bg-purple-600 hover:bg-purple-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {duration}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                    {[AspectRatio.WIDESCREEN, AspectRatio.PORTRAIT_WIDE, AspectRatio.SQUARE].map((ratio) => (
                        <Button
                            key={ratio}
                            variant={(nodeData.aspectRatio || AspectRatio.WIDESCREEN) === ratio ? 'default' : 'outline'}
                            onClick={() => onChange('aspectRatio', ratio)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.aspectRatio || AspectRatio.WIDESCREEN) === ratio ? "bg-purple-600 hover:bg-purple-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {ratio}
                        </Button>
                    ))}
                </div>
            </div>

            <ConnectionInfo accepts={['Text', 'Enhanced Text', 'Image']} outputs="Video" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string) || 'A cinematic scene';
                        if (handlers?.handleGenerateVideo) {
                            const result = await handlers.handleGenerateVideo({
                                prompt,
                                model: (nodeData.model as VideoModel) || VideoModel.RUNWAY,
                                duration: (nodeData.duration as VideoDuration) || VideoDuration.EIGHT_S,
                                aspectRatio: (nodeData.aspectRatio as AspectRatio) || AspectRatio.WIDESCREEN,
                                startImageUrl: nodeData.startImageUrl as string,
                                endImageUrl: nodeData.endImageUrl as string,
                            });
                            if (result) {
                                onChange('generationId', result.id);
                                onChange('status', result.status);
                            }
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>
            </div>
        </div>
    );
}

export function UpscaleNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Scan className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-indigo-300 font-medium">AI Upscaler</p>
                        <p className="text-[10px] text-indigo-300/60 mt-1">Uses Magnific AI technology for enhanced 2x/4x upscaling.</p>
                    </div>
                </div>
            </div>

            {nodeData.previewUrl ? (
                <div className="aspect-video rounded-lg bg-black/20 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={nodeData.previewUrl as string} alt="Upscaled preview" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="aspect-video rounded-lg bg-black/20 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10">
                    <Scan className="w-8 h-8 text-white/20" />
                    <p className="text-xs text-white/30">Waiting for image...</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Scale Factor</label>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={(nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.TWO_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            (nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                        )}
                    >
                        <Scan className="w-4 h-4" /> 2x
                    </Button>
                    <Button
                        variant={nodeData.scale === UpscaleFactor.FOUR_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.FOUR_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            nodeData.scale === UpscaleFactor.FOUR_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                        )}
                    >
                        <Scan className="w-4 h-4" /> 4x Pro
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Enhancement Mode</label>
                <select
                    value={(nodeData.enhanceMode as string) || UpscaleMode.CREATIVE}
                    onChange={(e) => onChange('enhanceMode', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                    <option value={UpscaleMode.CREATIVE}>Creative (Add Details)</option>
                    <option value={UpscaleMode.FAITHFUL}>Faithful (Preserve Original)</option>
                    <option value={UpscaleMode.BALANCED}>Balanced (Best of Both)</option>
                </select>
            </div>

            <ConnectionInfo accepts={['Image']} outputs="Upscaled Image" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const imageUrl = (nodeData.inputImageUrl as string) || (nodeData.previewUrl as string);
                        if (!imageUrl || !handlers?.handleUpscaleImage) return;
                        const scale = Number(nodeData.scale) === UpscaleFactor.FOUR_X ? 4 : 2;
                        const result = await handlers.handleUpscaleImage({
                            imageUrl,
                            scale: scale as 2 | 4,
                            enhanceMode: (nodeData.enhanceMode as UpscaleMode) || UpscaleMode.CREATIVE,
                        });
                        if (result) {
                            onChange('generationId', result.id);
                            onChange('status', result.status);
                            toast.success('Upscaling started');
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-indigo-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    {isGenerating ? 'Upscaling...' : `Upscale ${String(nodeData.scale) || '2x'}`}
                </Button>
            </div>
        </div>
    );
}

export function AssistantNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-emerald-300 font-medium">AI Prompt Enhancer</p>
                        <p className="text-[10px] text-emerald-300/60 mt-1">Transforms simple prompts into detailed, optimized descriptions.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Enhancement Mode</label>
                <select
                    value={(nodeData.mode as string) || AssistantMode.ENHANCE}
                    onChange={(e) => onChange('mode', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                    <option value={AssistantMode.ENHANCE}>Enhance - Improve clarity & detail</option>
                    <option value={AssistantMode.EXPAND}>Expand - Add creative details</option>
                    <option value={AssistantMode.CREATIVE}>Creative - Artistic interpretation</option>
                    <option value={AssistantMode.PROFESSIONAL}>Professional - Commercial quality</option>
                    <option value={AssistantMode.CINEMATIC}>Cinematic - Film-like descriptions</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Style Emphasis</label>
                <div className="flex flex-wrap gap-2">
                    {[StyleEmphasis.NONE, StyleEmphasis.PHOTOREALISTIC, StyleEmphasis.ARTISTIC, StyleEmphasis.ANIME, StyleEmphasis.FANTASY, StyleEmphasis.SCI_FI].map((style) => (
                        <Button
                            key={style}
                            variant={(nodeData.styleEmphasis || StyleEmphasis.NONE) === style ? 'default' : 'outline'}
                            onClick={() => onChange('styleEmphasis', style)}
                            className={cn(
                                "h-7 px-2 text-[10px] font-medium transition-all",
                                (nodeData.styleEmphasis || StyleEmphasis.NONE) === style ? "bg-emerald-600 hover:bg-emerald-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {style}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Detail Level</label>
                <div className="grid grid-cols-3 gap-2">
                    {[DetailLevel.LOW, DetailLevel.MEDIUM, DetailLevel.HIGH].map((level) => (
                        <Button
                            key={level}
                            variant={(nodeData.detailLevel || DetailLevel.MEDIUM) === level ? 'default' : 'outline'}
                            onClick={() => onChange('detailLevel', level)}
                            className={cn(
                                "h-9 text-xs font-medium capitalize",
                                (nodeData.detailLevel || DetailLevel.MEDIUM) === level ? "bg-emerald-600 hover:bg-emerald-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {level}
                        </Button>
                    ))}
                </div>
            </div>

            <ConnectionInfo accepts={['Text']} outputs="Enhanced Text" />

            {(nodeData.enhancedText as string) && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-white/60">Enhanced Output</label>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs text-white/80 max-h-32 overflow-y-auto">
                        {nodeData.enhancedText as string}
                    </div>
                </div>
            )}

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string);
                        if (!prompt || !handlers?.handleEnhancePrompt) return;
                        const enhanced = await handlers.handleEnhancePrompt({
                            prompt,
                            style: (nodeData.styleEmphasis as StyleEmphasis) || StyleEmphasis.PHOTOREALISTIC,
                        });
                        if (enhanced) {
                            onChange('enhancedText', enhanced);
                            toast.success('Prompt enhanced');
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? 'Enhancing...' : 'Enhance Prompt'}
                </Button>
            </div>
        </div>
    );
}

