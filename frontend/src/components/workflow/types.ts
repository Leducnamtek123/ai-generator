/**
 * Workflow Types — Barrel Export
 *
 * Re-exports all types from split modules for backwards compatibility.
 * Import from './types' continues to work everywhere.
 */

// Enums
export {
    WorkflowNodeType,
    NodeCategory,
    NodeStatus,
    ExecutionMode,
    FileMediaType,
    ImageModel,
    VideoModel,
    AspectRatio,
    ImageQuality,
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
} from './NodeEnums';

// Interfaces & Data Types
export type {
    BaseNodeData,
    TextNodeData,
    MediaNodeData,
    ImageGenNodeData,
    VideoGenNodeData,
    AssistantNodeData,
    UpscaleNodeData,
    CameraNodeData,
    StickyNoteNodeData,
    GroupNodeData,
    CommentNodeData,
    WorkflowNodeData,
    ConnectionConfig,
    GenerateImageRequest,
    GenerateVideoRequest,
    EnhancePromptRequest,
    UpscaleImageRequest,
    GenerationResult,
    WorkflowData,
    SerializedNode,
    SerializedEdge,
    MediaItem,
    MediaFolder,
    MediaLibraryResponse,
} from './NodeInterfaces';

// Config & Constants
export {
    NODE_CONFIG,
    QUICK_START_NODES,
    MAIN_NODES,
    UTILITY_NODES,
} from './NodeConfig';
export type { NodeConfig } from './NodeConfig';
