/**
 * Workflow Node Configuration
 *
 * Centralized NODE_CONFIG map and node group constants.
 */

import React from 'react';
import {
    Type,
    Image as ImageIcon,
    Video,
    Sparkles,
    Scan,
    Camera,
    Upload,
    StickyNote,
    Layers,
    Smile,
    MessageSquare,
} from 'lucide-react';

import {
    WorkflowNodeType,
    NodeCategory,
    NodeStatus,
    ConnectionType,
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
    FileMediaType,
} from './NodeEnums';

import type {
    WorkflowNodeData,
    ConnectionConfig,
    MediaNodeData,
    TextNodeData,
    ImageGenNodeData,
    VideoGenNodeData,
    AssistantNodeData,
    UpscaleNodeData,
    CameraNodeData,
    StickyNoteNodeData,
    GroupNodeData,
    CommentNodeData,
} from './NodeInterfaces';

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
    defaultData: Partial<WorkflowNodeData>;
}

export const NODE_CONFIG: Record<WorkflowNodeType, NodeConfig> = {
    [WorkflowNodeType.MEDIA]: {
        type: WorkflowNodeType.MEDIA,
        label: 'Media',
        icon: Upload,
        category: NodeCategory.INPUT,
        description: 'Upload or import files',
        color: 'text-white/80',
        connections: { accepts: [], outputs: ConnectionType.MEDIA },
        defaultData: {
            label: 'Media Upload',
            status: NodeStatus.IDLE,
            mediaType: FileMediaType.ANY,
        } as Partial<MediaNodeData>,
    },
    [WorkflowNodeType.TEXT]: {
        type: WorkflowNodeType.TEXT,
        label: 'Text',
        icon: Type,
        category: NodeCategory.INPUT,
        description: 'Add prompt or instructions',
        color: 'text-green-500',
        connections: { accepts: [], outputs: ConnectionType.TEXT },
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
            model: ImageModel.SEEDREAM,
            count: 1,
            aspectRatio: AspectRatio.SQUARE,
            quality: ImageQuality.HD,
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
            model: VideoModel.RUNWAY,
            duration: VideoDuration.EIGHT_S,
            aspectRatio: AspectRatio.WIDESCREEN,
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
            mode: AssistantMode.ENHANCE,
            styleEmphasis: StyleEmphasis.NONE,
            detailLevel: DetailLevel.MEDIUM,
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
            scale: UpscaleFactor.TWO_X,
            enhanceMode: UpscaleMode.CREATIVE,
            model: UpscaleModel.MAGNIFIC_V2,
            preset: UpscalePreset.BALANCED,
            sharpness: 20,
            grain: 10,
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
            angle: CameraAngle.FRONT,
        } as Partial<CameraNodeData>,
    },
    [WorkflowNodeType.STICKY_NOTE]: {
        type: WorkflowNodeType.STICKY_NOTE,
        label: 'Sticky Note',
        icon: StickyNote,
        category: NodeCategory.UTILITY,
        description: 'Add notes to your workflow',
        color: 'text-yellow-400',
        connections: { accepts: [], outputs: ConnectionType.TEXT },
        defaultData: {
            label: 'Sticky Note',
            status: NodeStatus.IDLE,
            content: '',
            color: NoteColor.YELLOW,
        } as Partial<StickyNoteNodeData>,
    },
    [WorkflowNodeType.GROUP]: {
        type: WorkflowNodeType.GROUP,
        label: 'Group',
        icon: Layers,
        category: NodeCategory.UTILITY,
        description: 'Group nodes together',
        color: 'text-gray-400',
        connections: { accepts: [], outputs: ConnectionType.REFERENCE },
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
        connections: { accepts: [], outputs: ConnectionType.REFERENCE },
        defaultData: { label: 'Sticker', status: NodeStatus.IDLE },
    },
    [WorkflowNodeType.COMMENT]: {
        type: WorkflowNodeType.COMMENT,
        label: 'Comment',
        icon: MessageSquare,
        category: NodeCategory.UTILITY,
        description: 'Add comments to your workflow',
        color: 'text-yellow-400',
        connections: { accepts: [], outputs: ConnectionType.REFERENCE },
        defaultData: {
            label: 'Comment',
            status: NodeStatus.IDLE,
            text: '',
            color: 'yellow',
            isMinimized: false,
            isPinned: false,
        } as Partial<CommentNodeData>,
    },
};

// ============================================
// NODE GROUP CONSTANTS
// ============================================

export const QUICK_START_NODES = [
    WorkflowNodeType.MEDIA,
    WorkflowNodeType.TEXT,
    WorkflowNodeType.IMAGE_GEN,
    WorkflowNodeType.VIDEO_GEN,
    WorkflowNodeType.ASSISTANT,
];

export const MAIN_NODES = [
    WorkflowNodeType.TEXT,
    WorkflowNodeType.IMAGE_GEN,
    WorkflowNodeType.VIDEO_GEN,
    WorkflowNodeType.ASSISTANT,
    WorkflowNodeType.UPSCALE,
    WorkflowNodeType.CAMERA,
];

export const UTILITY_NODES = [
    WorkflowNodeType.STICKY_NOTE,
    WorkflowNodeType.STICKER,
    WorkflowNodeType.GROUP,
];
