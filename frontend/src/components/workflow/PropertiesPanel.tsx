'use client';

import * as React from 'react';
import { Node } from '@xyflow/react';
import {
    X, Settings2, Sparkles, Image as ImageIcon, Type, Scan, Upload, ArrowRight,
    Play, Loader2, Video, Wand2, Copy, ExternalLink, Download, RefreshCw
} from 'lucide-react';
import { useGeneration } from '@/hooks/useGeneration';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onChange: (id: string, data: Record<string, unknown>) => void;
    onClose: () => void;
}

export function PropertiesPanel({ selectedNode, onChange, onClose }: PropertiesPanelProps): any {
    const { isGenerating, handleGenerateImage, handleGenerateVideo, handleUpscaleImage, handleEnhancePrompt } = useGeneration();

    if (!selectedNode) return null;

    // Cast data to a record type for easier access
    const nodeData = selectedNode.data as Record<string, unknown>;

    const handleChange = (key: string, value: unknown) => {
        onChange(selectedNode.id, { ...nodeData, [key]: value });
    };

    const renderConnectionInfo = (accepts: string[], outputs: string): any => (
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

    const renderContent = (): any => {
        switch (selectedNode.type) {
            case 'text':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
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

                        {/* Text Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Prompt Text</label>
                            <textarea
                                value={(nodeData.text as string) || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('text', e.target.value)}
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-green-500/50 resize-none font-mono"
                                placeholder="Describe what you want to create..."
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-white/30">{((nodeData.text as string) || '').length} characters</p>
                                <button
                                    onClick={() => handleChange('text', '')}
                                    className="text-[10px] text-white/40 hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {renderConnectionInfo(['None (Input Node)'], 'Text Prompt')}

                        {/* Quick Starters */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Quick Starters</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Portrait photo of a person', 'Beautiful landscape scene', 'Professional product shot', 'Abstract art composition'].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleChange('text', prompt)}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors text-left"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Style Options */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Style Presets</label>
                            <div className="flex flex-wrap gap-2">
                                {['Photorealistic', 'Cinematic', 'Anime', 'Digital Art', '3D Render', 'Watercolor'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => handleChange('text', `${(nodeData.text as string) || ''}, ${style.toLowerCase()} style`)}
                                        className="px-2 py-1 bg-white/5 hover:bg-green-500/20 hover:text-green-400 rounded text-[10px] text-white/60 transition-colors"
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'media':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
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

                        {renderConnectionInfo(['None (Input Node)'], 'Image/Video')}

                        {/* Current Media */}
                        {nodeData.mediaUrl && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/60">Current Media</label>
                                <div className="p-3 bg-black/20 rounded-lg space-y-2">
                                    <p className="text-xs text-white truncate">{nodeData.mediaName as string}</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                            <ExternalLink className="w-3 h-3" />
                                            Open
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleChange('mediaUrl', '');
                                                handleChange('mediaName', '');
                                            }}
                                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-[10px] text-red-400 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Media Type Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Media Type Filter</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['any', 'image', 'video'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleChange('mediaType', type)}
                                        className={`p-2 rounded-lg text-xs font-medium capitalize transition-all ${(nodeData.mediaType || 'any') === type
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max File Size */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Max File Size</label>
                            <select
                                value={(nodeData.maxSize as string) || '10mb'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('maxSize', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            >
                                <option value="5mb">5 MB</option>
                                <option value="10mb">10 MB</option>
                                <option value="25mb">25 MB</option>
                                <option value="50mb">50 MB</option>
                            </select>
                        </div>
                    </div>
                );

            case 'generator':
            case 'image_gen':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
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

                        {/* Model Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">AI Model</label>
                            <select
                                value={(nodeData.model as string) || 'seedream'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('model', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="seedream">Seedream 4 4K ⭐</option>
                                <option value="flux">Flux Schnell</option>
                                <option value="imagen3">Google Imagen 3</option>
                                <option value="midjourney">Midjourney v6</option>
                                <option value="dalle3">DALL-E 3</option>
                                <option value="stable">Stable Diffusion XL</option>
                            </select>
                        </div>

                        {/* Aspect Ratio */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Aspect Ratio</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['1:1', '4:3', '16:9', '9:16'].map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => handleChange('aspectRatio', ratio)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${(nodeData.aspectRatio || '1:1') === ratio
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quality */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Quality</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['standard', 'hd', '4k'].map((quality) => (
                                    <button
                                        key={quality}
                                        onClick={() => handleChange('quality', quality)}
                                        className={`p-2 rounded-lg text-xs font-medium uppercase transition-all ${(nodeData.quality || 'hd') === quality
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Negative Prompt */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Negative Prompt (Optional)</label>
                            <textarea
                                value={(nodeData.negativePrompt as string) || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('negativePrompt', e.target.value)}
                                className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 resize-none"
                                placeholder="What to avoid in generation..."
                            />
                        </div>

                        {renderConnectionInfo(['Text', 'Enhanced Text'], 'Image')}

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={async () => {
                                    const prompt = (nodeData.inputPrompt as string) || 'A beautiful landscape';
                                    const result = await handleGenerateImage({
                                        prompt,
                                        model: (nodeData.model as string) || 'seedream',
                                        aspectRatio: (nodeData.aspectRatio as string) || '1:1',
                                        quality: (nodeData.quality as 'standard' | 'hd' | '4k') || 'hd',
                                        negativePrompt: nodeData.negativePrompt as string,
                                    });
                                    if (result) {
                                        handleChange('generationId', result.id);
                                        handleChange('status', result.status);
                                    }
                                }}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isGenerating ? 'Generating...' : 'Generate Image'}
                            </button>
                        </div>

                        {/* Last Used Prompt */}
                        {nodeData.usedPrompt && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-white/60">Last Used Prompt</label>
                                <div className="p-3 bg-black/20 rounded-lg text-xs text-white/60 max-h-20 overflow-y-auto">
                                    {nodeData.usedPrompt as string}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'video_gen':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Video className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-purple-300 font-medium">Video Generator</p>
                                    <p className="text-[10px] text-purple-300/60 mt-1">
                                        Generate AI videos from text or images.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Video Model</label>
                            <select
                                value={(nodeData.model as string) || 'runway'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('model', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                            >
                                <option value="runway">Runway Gen-3 ⭐</option>
                                <option value="sora">OpenAI Sora</option>
                                <option value="pika">Pika Labs</option>
                                <option value="kling">Kling AI</option>
                            </select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['4s', '8s', '16s', '24s'].map((duration) => (
                                    <button
                                        key={duration}
                                        onClick={() => handleChange('duration', duration)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${(nodeData.duration || '8s') === duration
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {duration}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['16:9', '9:16', '1:1'].map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => handleChange('aspectRatio', ratio)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${(nodeData.aspectRatio || '16:9') === ratio
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {renderConnectionInfo(['Text', 'Enhanced Text', 'Image'], 'Video')}

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={async () => {
                                    const prompt = (nodeData.inputPrompt as string) || 'A cinematic scene';
                                    const result = await handleGenerateVideo({
                                        prompt,
                                        model: (nodeData.model as string) || 'runway',
                                        duration: (nodeData.duration as string) || '8s',
                                        aspectRatio: (nodeData.aspectRatio as string) || '16:9',
                                        startImageUrl: nodeData.startImageUrl as string,
                                        endImageUrl: nodeData.endImageUrl as string,
                                    });
                                    if (result) {
                                        handleChange('generationId', result.id);
                                        handleChange('status', result.status);
                                    }
                                }}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isGenerating ? 'Generating...' : 'Generate Video'}
                            </button>
                        </div>
                    </div>
                );

            case 'upscale':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Scan className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-indigo-300 font-medium">AI Upscaler</p>
                                    <p className="text-[10px] text-indigo-300/60 mt-1">
                                        Uses Magnific AI technology for enhanced 2x/4x upscaling.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Area */}
                        {nodeData.previewUrl ? (
                            <div className="aspect-video rounded-lg bg-black/20 overflow-hidden relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={nodeData.previewUrl as string}
                                    alt="Upscaled preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video rounded-lg bg-black/20 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10">
                                <Scan className="w-8 h-8 text-white/20" />
                                <p className="text-xs text-white/30">Waiting for image...</p>
                                <p className="text-[10px] text-white/20">Connect a Generator node</p>
                            </div>
                        )}

                        {/* Scale Factor */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Scale Factor</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleChange('scale', '2x')}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${(nodeData.scale || '2x') === '2x'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    <Scan className="w-4 h-4" />
                                    2x
                                </button>
                                <button
                                    onClick={() => handleChange('scale', '4x')}
                                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${(nodeData.scale) === '4x'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    <Scan className="w-4 h-4" />
                                    4x Pro
                                </button>
                            </div>
                        </div>

                        {/* Enhancement Mode */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Enhancement Mode</label>
                            <select
                                value={(nodeData.enhanceMode as string) || 'balanced'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('enhanceMode', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                            >
                                <option value="balanced">Balanced</option>
                                <option value="creative">Creative (Add Details)</option>
                                <option value="faithful">Faithful (Preserve Original)</option>
                            </select>
                        </div>

                        {renderConnectionInfo(['Image'], 'Upscaled Image')}

                        {/* Action Button */}
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={async () => {
                                    const imageUrl = (nodeData.inputImageUrl as string) || (nodeData.previewUrl as string);
                                    if (!imageUrl) return;
                                    const scale = (nodeData.scale as string) === '4x' ? 4 : 2;
                                    const result = await handleUpscaleImage({
                                        imageUrl,
                                        scale: scale as 2 | 4,
                                        enhanceMode: (nodeData.enhanceMode as 'balanced' | 'creative' | 'faithful') || 'balanced',
                                    });
                                    if (result) {
                                        handleChange('generationId', result.id);
                                        handleChange('status', result.status);
                                    }
                                }}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                                {isGenerating ? 'Upscaling...' : `Upscale ${(nodeData.scale as string) || '2x'}`}
                            </button>
                        </div>
                    </div>
                );

            case 'assistant':
                return (
                    <div className="space-y-4">
                        {/* Info Box */}
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-emerald-300 font-medium">AI Prompt Enhancer</p>
                                    <p className="text-[10px] text-emerald-300/60 mt-1">
                                        Transforms simple prompts into detailed, optimized descriptions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Enhancement Mode */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Enhancement Mode</label>
                            <select
                                value={(nodeData.mode as string) || 'enhance'}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('mode', e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                            >
                                <option value="enhance">Enhance - Improve clarity & detail</option>
                                <option value="expand">Expand - Add creative details</option>
                                <option value="creative">Creative - Artistic interpretation</option>
                                <option value="professional">Professional - Commercial quality</option>
                                <option value="cinematic">Cinematic - Film-like descriptions</option>
                            </select>
                        </div>

                        {/* Style Emphasis */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Style Emphasis</label>
                            <div className="flex flex-wrap gap-2">
                                {['None', 'Photorealistic', 'Artistic', 'Anime', 'Fantasy', 'Sci-Fi'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => handleChange('styleEmphasis', style.toLowerCase())}
                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${(nodeData.styleEmphasis || 'none') === style.toLowerCase()
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detail Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/60">Detail Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['low', 'medium', 'high'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => handleChange('detailLevel', level)}
                                        className={`p-2 rounded-lg text-xs font-medium capitalize transition-all ${(nodeData.detailLevel || 'medium') === level
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {renderConnectionInfo(['Text'], 'Enhanced Text')}

                        {/* Enhanced Output */}
                        {nodeData.enhancedText && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-white/60">Enhanced Output</label>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(nodeData.enhancedText as string)}
                                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300"
                                    >
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </button>
                                </div>
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs text-white/80 max-h-32 overflow-y-auto">
                                    {nodeData.enhancedText as string}
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="space-y-2 pt-2">
                            <button
                                onClick={async () => {
                                    const prompt = (nodeData.inputPrompt as string);
                                    if (!prompt) return;
                                    const enhanced = await handleEnhancePrompt({
                                        prompt,
                                        style: (nodeData.styleEmphasis as string) || 'photorealistic',
                                    });
                                    if (enhanced) {
                                        handleChange('enhancedText', enhanced);
                                    }
                                }}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                {isGenerating ? 'Enhancing...' : 'Enhance Prompt'}
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Settings2 className="w-8 h-8 text-white/20 mb-3" />
                        <p className="text-sm text-white/40">No properties available</p>
                        <p className="text-xs text-white/20 mt-1">Select a different node</p>
                    </div>
                );
        }
    };

    const getIcon = () => {
        switch (selectedNode.type) {
            case 'text': return <Type className="w-4 h-4 text-green-400" />;
            case 'media': return <Upload className="w-4 h-4 text-cyan-400" />;
            case 'generator':
            case 'image_gen': return <ImageIcon className="w-4 h-4 text-blue-400" />;
            case 'video_gen': return <Video className="w-4 h-4 text-purple-400" />;
            case 'assistant': return <Sparkles className="w-4 h-4 text-emerald-400" />;
            case 'upscale': return <Scan className="w-4 h-4 text-indigo-400" />;
            default: return <Settings2 className="w-4 h-4 text-white/60" />;
        }
    };

    const getTitle = () => {
        switch (selectedNode.type) {
            case 'text': return 'Text Prompt';
            case 'media': return 'Media Upload';
            case 'generator':
            case 'image_gen': return 'Image Generator';
            case 'video_gen': return 'Video Generator';
            case 'assistant': return 'AI Assistant';
            case 'upscale': return 'AI Upscaler';
            default: return 'Properties';
        }
    };

    return (
        <div className="w-80 h-full border-l border-white/5 bg-[#0B0C0E] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {getIcon() as any}
                    <span className="font-semibold text-sm text-white">{getTitle()}</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
                {renderContent() as any}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-white/30">
                    <span>Node ID: {selectedNode.id.slice(0, 8)}</span>
                    <span>Status: {(nodeData.status as string) || 'idle'}</span>
                </div>
            </div>
        </div>
    );
}
