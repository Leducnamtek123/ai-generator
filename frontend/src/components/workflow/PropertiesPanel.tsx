'use client';

import * as React from 'react';
import { Node } from '@xyflow/react';
import { X, Settings2, Sparkles, Image as ImageIcon, Type, Scan, Upload, Video, Wand2 } from 'lucide-react';
import { useGeneration } from '@/hooks/useGeneration';
import { Button } from '@/ui/button';
import { getGenerationProviders, type GenerationProviderInfo } from '@/lib/api/generations';
import { WorkflowNodeType } from './types';
import {
    TextNodePanel,
    MediaNodePanel,
    ImageGenNodePanel,
    VideoGenNodePanel,
    UpscaleNodePanel,
    AssistantNodePanel,
    ToolNodePanel
} from './NodePanels';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onChange: (id: string, data: Record<string, unknown>) => void;
    onClose: () => void;
}

export function PropertiesPanel({ selectedNode, onChange, onClose }: PropertiesPanelProps) {
    const { isGenerating, handleGenerateImage, handleGenerateVideo, handleUpscaleImage, handleEnhancePrompt } = useGeneration();
    const [providers, setProviders] = React.useState<GenerationProviderInfo[]>([]);
    const [providersLoading, setProvidersLoading] = React.useState(false);
    const selectedType = selectedNode?.type;
    const nodeData = (selectedNode?.data ?? {}) as Record<string, unknown>;

    React.useEffect(() => {
        let cancelled = false;

        const loadProviders = async () => {
            const supportedNode =
                selectedType === WorkflowNodeType.IMAGE_GEN ||
                selectedType === WorkflowNodeType.VIDEO_GEN ||
                selectedType === WorkflowNodeType.UPSCALE ||
                selectedType === WorkflowNodeType.ASSISTANT ||
                selectedType === WorkflowNodeType.TOOL;

            if (!supportedNode) {
                setProviders([]);
                return;
            }

            setProvidersLoading(true);
            try {
                const list = await getGenerationProviders();
                if (!cancelled) {
                    setProviders(list);
                }
            } catch {
                if (!cancelled) {
                    setProviders([]);
                }
            } finally {
                if (!cancelled) {
                    setProvidersLoading(false);
                }
            }
        };

        void loadProviders();

        return () => {
            cancelled = true;
        };
    }, [selectedType]);

    if (!selectedNode) return null;

    const handleChange = (key: string, value: unknown) => {
        onChange(selectedNode.id, { [key]: value });
    };

    const getIcon = () => {
        switch (selectedNode.type) {
            case WorkflowNodeType.TEXT: return <Type className="size-4 text-green-400" />;
            case WorkflowNodeType.MEDIA: return <Upload className="size-4 text-cyan-400" />;
            case WorkflowNodeType.IMAGE_GEN: return <ImageIcon className="size-4 text-blue-400" />;
            case WorkflowNodeType.VIDEO_GEN: return <Video className="size-4 text-purple-400" />;
            case WorkflowNodeType.ASSISTANT: return <Sparkles className="size-4 text-emerald-400" />;
            case WorkflowNodeType.UPSCALE: return <Scan className="size-4 text-violet-400" />;
            case WorkflowNodeType.TOOL: return <Wand2 className="size-4 text-fuchsia-400" />;
            default: return <Settings2 className="size-4 text-white/60" />;
        }
    };

    const getTitle = () => {
        switch (selectedNode.type) {
            case WorkflowNodeType.TEXT: return 'Text Prompt';
            case WorkflowNodeType.MEDIA: return 'Media Upload';
            case WorkflowNodeType.IMAGE_GEN: return 'Image Generator';
            case WorkflowNodeType.VIDEO_GEN: return 'Video Generator';
            case WorkflowNodeType.ASSISTANT: return 'AI Assistant';
            case WorkflowNodeType.UPSCALE: return 'AI Upscaler';
            case WorkflowNodeType.TOOL: return 'Tool Node';
            default: return 'Properties';
        }
    };

    return (
        <div className="w-80 h-full border-l border-border bg-popover flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="font-semibold text-sm text-foreground">{getTitle()}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
                {(selectedNode.type === WorkflowNodeType.IMAGE_GEN ||
                    selectedNode.type === WorkflowNodeType.VIDEO_GEN ||
                    selectedNode.type === WorkflowNodeType.UPSCALE ||
                    selectedNode.type === WorkflowNodeType.ASSISTANT ||
                    selectedNode.type === WorkflowNodeType.TOOL) && (
                    <div className="mb-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Preferred Provider</div>
                        <select
                            value={(nodeData.provider as string) || ''}
                            onChange={(e) => handleChange('provider', e.target.value)}
                            className="w-full h-11 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50 appearance-none"
                        >
                            <option value="">Auto / Default</option>
                            {providersLoading && <option value="">Loading providers?</option>}
                            {providers.map((provider) => (
                                <option key={provider.name} value={provider.name}>
                                    {provider.name}
                                    {provider.capabilities.length ? ` · ${provider.capabilities.join(', ')}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <PropertiesContent
                    selectedNode={selectedNode}
                    nodeData={nodeData}
                    onChange={handleChange}
                    isGenerating={isGenerating}
                    handleGenerateImage={handleGenerateImage}
                    handleGenerateVideo={handleGenerateVideo}
                    handleUpscaleImage={handleUpscaleImage}
                    handleEnhancePrompt={handleEnhancePrompt}
                />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Node ID: {selectedNode.id.slice(0, 8)}</span>
                    <span>Status: {String(nodeData.status || 'idle')}</span>
                </div>
            </div>
        </div>
    );
}

interface PropertiesContentProps {
    selectedNode: Node;
    nodeData: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    isGenerating: boolean;
    handleGenerateImage: ReturnType<typeof useGeneration>['handleGenerateImage'];
    handleGenerateVideo: ReturnType<typeof useGeneration>['handleGenerateVideo'];
    handleUpscaleImage: ReturnType<typeof useGeneration>['handleUpscaleImage'];
    handleEnhancePrompt: ReturnType<typeof useGeneration>['handleEnhancePrompt'];
}

function PropertiesContent({
    selectedNode,
    nodeData,
    onChange,
    isGenerating,
    handleGenerateImage,
    handleGenerateVideo,
    handleUpscaleImage,
    handleEnhancePrompt,
}: PropertiesContentProps) {
    const commonProps = {
        nodeId: selectedNode.id,
        nodeData,
        onChange,
        isGenerating,
        handlers: {
            handleGenerateImage,
            handleGenerateVideo,
            handleUpscaleImage,
            handleEnhancePrompt,
        },
    };

    switch (selectedNode.type) {
        case WorkflowNodeType.TEXT:
            return <TextNodePanel {...commonProps} />;
        case WorkflowNodeType.MEDIA:
            return <MediaNodePanel {...commonProps} />;
        case WorkflowNodeType.IMAGE_GEN:
            return <ImageGenNodePanel {...commonProps} />;
        case WorkflowNodeType.VIDEO_GEN:
            return <VideoGenNodePanel {...commonProps} />;
        case WorkflowNodeType.ASSISTANT:
            return <AssistantNodePanel {...commonProps} />;
        case WorkflowNodeType.UPSCALE:
            return <UpscaleNodePanel {...commonProps} />;
        case WorkflowNodeType.TOOL:
            return <ToolNodePanel {...commonProps} />;
        default:
            return (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Settings2 className="size-8 text-white/20 mb-3" />
                    <p className="text-sm text-white/40">No properties available</p>
                    <p className="text-xs text-white/20 mt-1">Select a different node</p>
                </div>
            );
    }
}
