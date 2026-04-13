/**
 * Workflow Node Data Interfaces
 *
 * All type/interface definitions for node data, connections, and API requests/responses.
 */

import {
    NodeStatus,
    FileMediaType,
    ImageModel,
    AspectRatio,
    ImageQuality,
    VideoModel,
    VideoDuration,
    AssistantMode,
    StyleEmphasis,
    DetailLevel,
    UpscaleFactor,
    UpscaleMode,
    UpscaleModel,
    UpscalePreset,
    CameraAngle,
    NoteColor,
    ConnectionType,
    WorkflowNodeType,
} from './NodeEnums';

export type { MediaItem, MediaFolder, MediaLibraryResponse } from '@/types/media';

// ============================================
// NODE DATA INTERFACES
// ============================================

export interface BaseNodeData {
    label: string;
    status: NodeStatus;
    error?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TextNodeData extends BaseNodeData {
    text: string;
    characterCount?: number;
}

export interface MediaNodeData extends BaseNodeData {
    mediaUrl?: string;
    mediaName?: string;
    mediaThumbnail?: string;
    mediaType: FileMediaType;
    mimeType?: string;
    fileSize?: number;
}

export interface ImageGenNodeData extends BaseNodeData {
    model: ImageModel;
    count: number;
    aspectRatio: AspectRatio;
    quality: ImageQuality;
    negativePrompt?: string;
    seed?: number;
    inputPrompt?: string;
    inputReference?: string;
    previewUrl?: string;
    outputUrls?: string[];
    generationId?: string;
}

export interface VideoGenNodeData extends BaseNodeData {
    model: VideoModel;
    duration: VideoDuration;
    aspectRatio: AspectRatio;
    fps?: number;
    inputPrompt?: string;
    inputImage?: string;
    previewUrl?: string;
    videoUrl?: string;
    generationId?: string;
}

export interface AssistantNodeData extends BaseNodeData {
    mode: AssistantMode;
    styleEmphasis: StyleEmphasis;
    detailLevel: DetailLevel;
    inputText?: string;
    enhancedText?: string;
}

export interface UpscaleNodeData extends BaseNodeData {
    scale: UpscaleFactor;
    enhanceMode: UpscaleMode;
    model: UpscaleModel;
    preset: UpscalePreset;
    sharpness: number;
    grain: number;
    inputImageUrl?: string;
    previewUrl?: string;
    outputUrl?: string;
}

export interface CameraNodeData extends BaseNodeData {
    angle: CameraAngle;
    customRotation?: { x: number; y: number; z: number };
    inputImageUrl?: string;
    previewUrl?: string;
}

export interface StickyNoteNodeData extends BaseNodeData {
    content: string;
    color: NoteColor;
}

export interface GroupNodeData extends BaseNodeData {
    name: string;
    color?: string;
    childNodeIds: string[];
}

export interface CommentNodeData extends BaseNodeData {
    text: string;
    author?: string;
    timestamp?: number;
    color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
    isMinimized?: boolean;
    isPinned?: boolean;
}

export type WorkflowNodeData =
    | TextNodeData
    | MediaNodeData
    | ImageGenNodeData
    | VideoGenNodeData
    | AssistantNodeData
    | UpscaleNodeData
    | CameraNodeData
    | StickyNoteNodeData
    | GroupNodeData
    | CommentNodeData;

// ============================================
// CONNECTION INTERFACES
// ============================================

export interface ConnectionConfig {
    accepts: ConnectionType[];
    outputs: ConnectionType;
    maxInputs?: number;
    requiresInput?: boolean;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

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

export interface GenerateVideoRequest {
    nodeId: string;
    workflowId: string;
    prompt: string;
    model: VideoGenNodeData['model'];
    duration: VideoGenNodeData['duration'];
    aspectRatio: VideoGenNodeData['aspectRatio'];
    inputImageUrl?: string;
}

export interface EnhancePromptRequest {
    nodeId: string;
    workflowId: string;
    inputText: string;
    mode: AssistantNodeData['mode'];
    styleEmphasis: AssistantNodeData['styleEmphasis'];
    detailLevel: AssistantNodeData['detailLevel'];
}

export interface UpscaleImageRequest {
    nodeId: string;
    workflowId: string;
    inputImageUrl: string;
    scale: UpscaleNodeData['scale'];
    enhanceMode: UpscaleNodeData['enhanceMode'];
    model: UpscaleNodeData['model'];
    preset: UpscaleNodeData['preset'];
    sharpness: UpscaleNodeData['sharpness'];
    grain: UpscaleNodeData['grain'];
}

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
