'use client';

import * as React from 'react';
import {
    GenerationResult,
    GenerateImageParams,
    GenerateVideoParams,
    UpscaleImageParams,
    EnhancePromptParams,
} from '@/lib/api/generations';

// Export Props for sub-components
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

// Re-export specific panels from the panels directory
export { ConnectionInfo } from './panels/ConnectionInfo';
export { TextNodePanel } from './panels/TextNodePanel';
export { MediaNodePanel } from './panels/MediaNodePanel';
export { ImageGenNodePanel } from './panels/ImageGenNodePanel';
export { VideoGenNodePanel } from './panels/VideoGenNodePanel';
export { UpscaleNodePanel } from './panels/UpscaleNodePanel';
export { AssistantNodePanel } from './panels/AssistantNodePanel';
