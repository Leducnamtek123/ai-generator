/**
 * Workflow Types & Interfaces
 * 
 * This file defines all types used in the workflow system.
 * Designed to be backend-compatible - these types should match your API schemas.
 * 
 * When integrating with backend:
 * 1. Sync these types with your API response types
 * 2. Add validation using zod or similar
 * 3. API responses should return these exact shapes
 */

import { Type, Image as ImageIcon, Video, Sparkles, Scan, Camera, FileText, Upload, StickyNote, Layers, Smile } from 'lucide-react';
import React from 'react';

// ============================================
// ENUMS - Match these with backend enums
// ============================================

export enum WorkflowNodeType {
    // Input Nodes
    MEDIA = 'media',
    TEXT = 'text',

    // Generation Nodes
    IMAGE_GEN = 'image_gen',
    VIDEO_GEN = 'video_gen',

    // Processing Nodes
    ASSISTANT = 'assistant',
    UPSCALE = 'upscale',
    CAMERA = 'camera',

    // Utility Nodes
    STICKY_NOTE = 'sticky_note',
    GROUP = 'group',
    STICKER = 'sticker',
}

export enum NodeCategory {
    INPUT = 'Input',
    GENERATION = 'Generation',
    MODIFICATION = 'Modification',
    UTILITY = 'Utility',
}

export enum NodeStatus {
    IDLE = 'idle',
    PROCESSING = 'processing',
    SUCCESS = 'success',
    ERROR = 'error',
    QUEUED = 'queued',
    UPLOADING = 'uploading',
}

export enum ConnectionType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    MEDIA = 'media',      // Can be image or video
    REFERENCE = 'reference',
    STYLE = 'style',
}

// ============================================
// NODE DATA INTERFACES - Backend Response Types
// ============================================

/** Base data that all nodes share */
export interface BaseNodeData {
    label: string;
    status: NodeStatus;
    error?: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Text/Prompt Node Data */
export interface TextNodeData extends BaseNodeData {
    text: string;
    characterCount?: number;
}

/** Media Upload Node Data */
export interface MediaNodeData extends BaseNodeData {
    mediaUrl?: string;
    mediaName?: string;
    mediaThumbnail?: string;
    mediaType: 'any' | 'image' | 'video';
    mimeType?: string;
    fileSize?: number;
}

/** Image Generator Node Data */
export interface ImageGenNodeData extends BaseNodeData {
    model: 'seedream' | 'flux' | 'imagen3' | 'midjourney' | 'dalle3' | 'stable';
    count: number;
    aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2';
    quality: 'standard' | 'hd' | '4k';
    negativePrompt?: string;
    seed?: number;

    // Input tracking (from connected nodes)
    inputPrompt?: string;
    inputReference?: string;

    // Output
    previewUrl?: string;
    outputUrls?: string[];
    generationId?: string;  // Backend job ID
}

/** Video Generator Node Data */
export interface VideoGenNodeData extends BaseNodeData {
    model: 'runway' | 'sora' | 'pika' | 'kling';
    duration: '4s' | '8s' | '16s' | '24s';
    aspectRatio: '16:9' | '9:16' | '1:1';
    fps?: number;

    // Input tracking
    inputPrompt?: string;
    inputImage?: string;

    // Output
    previewUrl?: string;
    videoUrl?: string;
    generationId?: string;
}

/** Assistant/Prompt Enhancer Node Data */
export interface AssistantNodeData extends BaseNodeData {
    mode: 'enhance' | 'expand' | 'creative' | 'professional' | 'cinematic';
    styleEmphasis: 'none' | 'photorealistic' | 'artistic' | 'anime' | 'fantasy' | 'sci-fi';
    detailLevel: 'low' | 'medium' | 'high';

    // Input/Output
    inputText?: string;
    enhancedText?: string;
}

/** Image Upscaler Node Data */
export interface UpscaleNodeData extends BaseNodeData {
    scale: '2x' | '4x';
    enhanceMode: 'balanced' | 'creative' | 'faithful';

    // Input/Output
    inputImageUrl?: string;
    previewUrl?: string;
    outputUrl?: string;
}

/** Camera Angle Node Data */
export interface CameraNodeData extends BaseNodeData {
    angle: 'front' | 'side' | 'top' | 'bottom' | '3/4' | 'custom';
    customRotation?: { x: number; y: number; z: number };

    // Input/Output
    inputImageUrl?: string;
    previewUrl?: string;
}

/** Sticky Note Node Data */
export interface StickyNoteNodeData extends BaseNodeData {
    content: string;
    color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
}

/** Group Node Data */
export interface GroupNodeData extends BaseNodeData {
    name: string;
    color?: string;
    childNodeIds: string[];
}

// Union type for all node data
export type WorkflowNodeData =
    | TextNodeData
    | MediaNodeData
    | ImageGenNodeData
    | VideoGenNodeData
    | AssistantNodeData
    | UpscaleNodeData
    | CameraNodeData
    | StickyNoteNodeData
    | GroupNodeData;

// ============================================
// CONNECTION INTERFACES
// ============================================

export interface ConnectionConfig {
    /** What types of data this node accepts */
    accepts: ConnectionType[];
    /** What type of data this node outputs */
    outputs: ConnectionType;
    /** Maximum number of inputs */
    maxInputs?: number;
    /** Whether this node requires at least one input */
    requiresInput?: boolean;
}

// ============================================
// NODE CONFIGURATION
// ============================================

export interface NodeConfig {
    type: WorkflowNodeType;
    label: string;
    icon: React.ElementType;
    category: NodeCategory;
    description: string;
    color: string;
    connections: ConnectionConfig;
    /** Default data when creating a new node of this type */
    defaultData: Partial<WorkflowNodeData>;
}

// Senior Standard: Centralized Configuration Map
export const NODE_CONFIG: Record<WorkflowNodeType, NodeConfig> = {
    [WorkflowNodeType.MEDIA]: {
        type: WorkflowNodeType.MEDIA,
        label: 'Media',
        icon: Upload,
        category: NodeCategory.INPUT,
        description: 'Upload or import files',
        color: 'text-white/80',
        connections: {
            accepts: [],
            outputs: ConnectionType.MEDIA,
        },
        defaultData: {
            label: 'Media Upload',
            status: NodeStatus.IDLE,
            mediaType: 'any',
        } as Partial<MediaNodeData>,
    },
    [WorkflowNodeType.TEXT]: {
        type: WorkflowNodeType.TEXT,
        label: 'Text',
        icon: Type,
        category: NodeCategory.INPUT,
        description: 'Add prompt or instructions',
        color: 'text-green-500',
        connections: {
            accepts: [],
            outputs: ConnectionType.TEXT,
        },
        defaultData: {
            label: 'Text Prompt',
            status: NodeStatus.IDLE,
            text: '',
        } as Partial<TextNodeData>,
    },
    [WorkflowNodeType.IMAGE_GEN]: {
        type: WorkflowNodeType.IMAGE_GEN,
        label: 'Image Generator',
        icon: ImageIcon,
        category: NodeCategory.GENERATION,
        description: 'Create images from text',
        color: 'text-blue-500',
        connections: {
            accepts: [ConnectionType.TEXT, ConnectionType.IMAGE, ConnectionType.REFERENCE],
            outputs: ConnectionType.IMAGE,
            maxInputs: 3,
        },
        defaultData: {
            label: 'Image Generator',
            status: NodeStatus.IDLE,
            model: 'seedream',
            count: 1,
            aspectRatio: '1:1',
            quality: 'hd',
        } as Partial<ImageGenNodeData>,
    },
    [WorkflowNodeType.VIDEO_GEN]: {
        type: WorkflowNodeType.VIDEO_GEN,
        label: 'Video Generator',
        icon: Video,
        category: NodeCategory.GENERATION,
        description: 'Generate video clips',
        color: 'text-green-500',
        connections: {
            accepts: [ConnectionType.TEXT, ConnectionType.IMAGE],
            outputs: ConnectionType.VIDEO,
            maxInputs: 2,
        },
        defaultData: {
            label: 'Video Generator',
            status: NodeStatus.IDLE,
            model: 'runway',
            duration: '8s',
            aspectRatio: '16:9',
        } as Partial<VideoGenNodeData>,
    },
    [WorkflowNodeType.ASSISTANT]: {
        type: WorkflowNodeType.ASSISTANT,
        label: 'Assistant',
        icon: Sparkles,
        category: NodeCategory.GENERATION,
        description: 'AI helper for prompts',
        color: 'text-emerald-400',
        connections: {
            accepts: [ConnectionType.TEXT],
            outputs: ConnectionType.TEXT,
            requiresInput: true,
        },
        defaultData: {
            label: 'AI Assistant',
            status: NodeStatus.IDLE,
            mode: 'enhance',
            styleEmphasis: 'none',
            detailLevel: 'medium',
        } as Partial<AssistantNodeData>,
    },
    [WorkflowNodeType.UPSCALE]: {
        type: WorkflowNodeType.UPSCALE,
        label: 'Image Upscaler',
        icon: Scan,
        category: NodeCategory.MODIFICATION,
        description: 'Enhance resolution',
        color: 'text-indigo-400',
        connections: {
            accepts: [ConnectionType.IMAGE],
            outputs: ConnectionType.IMAGE,
            requiresInput: true,
        },
        defaultData: {
            label: 'AI Upscaler',
            status: NodeStatus.IDLE,
            scale: '2x',
            enhanceMode: 'balanced',
        } as Partial<UpscaleNodeData>,
    },
    [WorkflowNodeType.CAMERA]: {
        type: WorkflowNodeType.CAMERA,
        label: 'Camera Angle',
        icon: Camera,
        category: NodeCategory.MODIFICATION,
        description: 'Adjust viewpoint',
        color: 'text-white/60',
        connections: {
            accepts: [ConnectionType.IMAGE],
            outputs: ConnectionType.IMAGE,
            requiresInput: true,
        },
        defaultData: {
            label: 'Camera Angle',
            status: NodeStatus.IDLE,
            angle: 'front',
        } as Partial<CameraNodeData>,
    },
    [WorkflowNodeType.STICKY_NOTE]: {
        type: WorkflowNodeType.STICKY_NOTE,
        label: 'Sticky Note',
        icon: StickyNote,
        category: NodeCategory.UTILITY,
        description: 'Add notes to your workflow',
        color: 'text-yellow-400',
        connections: {
            accepts: [],
            outputs: ConnectionType.TEXT,
        },
        defaultData: {
            label: 'Sticky Note',
            status: NodeStatus.IDLE,
            content: '',
            color: 'yellow',
        } as Partial<StickyNoteNodeData>,
    },
    [WorkflowNodeType.GROUP]: {
        type: WorkflowNodeType.GROUP,
        label: 'Group',
        icon: Layers,
        category: NodeCategory.UTILITY,
        description: 'Group nodes together',
        color: 'text-gray-400',
        connections: {
            accepts: [],
            outputs: ConnectionType.REFERENCE,
        },
        defaultData: {
            label: 'Group',
            status: NodeStatus.IDLE,
            name: 'Untitled Group',
            childNodeIds: [],
        } as Partial<GroupNodeData>,
    },
    [WorkflowNodeType.STICKER]: {
        type: WorkflowNodeType.STICKER,
        label: 'Sticker',
        icon: Smile,
        category: NodeCategory.UTILITY,
        description: 'Add visual markers',
        color: 'text-pink-400',
        connections: {
            accepts: [],
            outputs: ConnectionType.REFERENCE,
        },
        defaultData: {
            label: 'Sticker',
            status: NodeStatus.IDLE,
        },
    },
};

// Quick start nodes shown in empty state
export const QUICK_START_NODES = [
    WorkflowNodeType.MEDIA,
    WorkflowNodeType.TEXT,
    WorkflowNodeType.IMAGE_GEN,
    WorkflowNodeType.VIDEO_GEN,
    WorkflowNodeType.ASSISTANT,
];

// All main nodes for node selector
export const MAIN_NODES = [
    WorkflowNodeType.TEXT,
    WorkflowNodeType.IMAGE_GEN,
    WorkflowNodeType.VIDEO_GEN,
    WorkflowNodeType.ASSISTANT,
    WorkflowNodeType.UPSCALE,
    WorkflowNodeType.CAMERA,
];

// Utility nodes
export const UTILITY_NODES = [
    WorkflowNodeType.STICKY_NOTE,
    WorkflowNodeType.STICKER,
    WorkflowNodeType.GROUP,
];

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** Request to generate an image */
export interface GenerateImageRequest {
    nodeId: string;
    workflowId: string;
    prompt: string;
    negativePrompt?: string;
    model: ImageGenNodeData['model'];
    count: number;
    aspectRatio: ImageGenNodeData['aspectRatio'];
    quality: ImageGenNodeData['quality'];
    referenceImageUrl?: string;
    seed?: number;
}

/** Request to generate a video */
export interface GenerateVideoRequest {
    nodeId: string;
    workflowId: string;
    prompt: string;
    model: VideoGenNodeData['model'];
    duration: VideoGenNodeData['duration'];
    aspectRatio: VideoGenNodeData['aspectRatio'];
    inputImageUrl?: string;
}

/** Request to enhance a prompt */
export interface EnhancePromptRequest {
    nodeId: string;
    workflowId: string;
    inputText: string;
    mode: AssistantNodeData['mode'];
    styleEmphasis: AssistantNodeData['styleEmphasis'];
    detailLevel: AssistantNodeData['detailLevel'];
}

/** Request to upscale an image */
export interface UpscaleImageRequest {
    nodeId: string;
    workflowId: string;
    inputImageUrl: string;
    scale: UpscaleNodeData['scale'];
    enhanceMode: UpscaleNodeData['enhanceMode'];
}

/** Generic generation result from backend */
export interface GenerationResult {
    success: boolean;
    nodeId: string;
    generationId: string;
    status: NodeStatus;
    outputUrls?: string[];
    previewUrl?: string;
    error?: string;
    processingTime?: number;
    creditsUsed?: number;
}

/** Workflow save/load types */
export interface WorkflowData {
    id: string;
    name: string;
    nodes: SerializedNode[];
    edges: SerializedEdge[];
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export interface SerializedNode {
    id: string;
    type: WorkflowNodeType;
    position: { x: number; y: number };
    data: WorkflowNodeData;
}

export interface SerializedEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

// ============================================
// MEDIA LIBRARY TYPES (for media picker)
// ============================================

export interface MediaItem {
    id: string;
    url: string;
    thumbnailUrl: string;
    name: string;
    type: 'image' | 'video';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;  // for videos
    createdAt: string;
    folder?: string;
}

export interface MediaFolder {
    id: string;
    name: string;
    icon: 'favorites' | 'history' | 'uploads' | 'downloads' | 'folder';
    count: number;
}

export interface MediaLibraryResponse {
    items: MediaItem[];
    folders: MediaFolder[];
    totalCount: number;
    hasMore: boolean;
}
