'use client';

import * as React from 'react';
import { Node } from '@xyflow/react';
import { X, Settings2, Sparkles, Image as ImageIcon, Type, Scan, Upload, Video } from 'lucide-react';
import { useGeneration } from '@/hooks/useGeneration';
import { Button } from '@/ui/button';
import { WorkflowNodeType } from './types';
import {
    TextNodePanel,
    MediaNodePanel,
    ImageGenNodePanel,
    VideoGenNodePanel,
    UpscaleNodePanel,
    AssistantNodePanel
} from './NodePanels';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onChange: (id: string, data: Record<string, unknown>) => void;
    onClose: () => void;
}

export function PropertiesPanel({ selectedNode, onChange, onClose }: PropertiesPanelProps) {
    const { isGenerating, handleGenerateImage, handleGenerateVideo, handleUpscaleImage, handleEnhancePrompt } = useGeneration();

    if (!selectedNode) return null;

    const nodeData = selectedNode.data as Record<string, unknown>;

    const handleChange = (key: string, value: unknown) => {
        onChange(selectedNode.id, { ...nodeData, [key]: value });
    };

    const renderContent = () => {
        const commonProps = {
            nodeId: selectedNode.id,
            nodeData,
            onChange: handleChange,
            isGenerating,
            handlers: {
                handleGenerateImage,
                handleGenerateVideo,
                handleUpscaleImage,
                handleEnhancePrompt
            }
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
            case WorkflowNodeType.TEXT: return <Type className="w-4 h-4 text-green-400" />;
            case WorkflowNodeType.MEDIA: return <Upload className="w-4 h-4 text-cyan-400" />;
            case WorkflowNodeType.IMAGE_GEN: return <ImageIcon className="w-4 h-4 text-blue-400" />;
            case WorkflowNodeType.VIDEO_GEN: return <Video className="w-4 h-4 text-purple-400" />;
            case WorkflowNodeType.ASSISTANT: return <Sparkles className="w-4 h-4 text-emerald-400" />;
            case WorkflowNodeType.UPSCALE: return <Scan className="w-4 h-4 text-indigo-400" />;
            default: return <Settings2 className="w-4 h-4 text-white/60" />;
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
            default: return 'Properties';
        }
    };

    return (
        <div className="w-80 h-full border-l border-white/5 bg-[#0B0C0E] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="font-semibold text-sm text-white">{getTitle()}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5 rounded-lg"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
                {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 shrink-0">
                <div className="flex items-center justify-between text-[10px] text-white/30">
                    <span>Node ID: {selectedNode.id.slice(0, 8)}</span>
                    <span>Status: {String(nodeData.status || 'idle')}</span>
                </div>
            </div>
        </div>
    );
}
