/**
 * Workflow Enums
 *
 * All enum definitions for the workflow system.
 * Designed to be backend-compatible.
 */

export enum WorkflowNodeType {
    MEDIA = 'media',
    TEXT = 'text',
    IMAGE_GEN = 'image_gen',
    VIDEO_GEN = 'video_gen',
    ASSISTANT = 'assistant',
    UPSCALE = 'upscale',
    CAMERA = 'camera',
    STICKY_NOTE = 'sticky_note',
    GROUP = 'group',
    STICKER = 'sticker',
    COMMENT = 'comment',
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

export enum ExecutionMode {
    WORKFLOW = 'workflow',
    LOCAL = 'local',
}

export enum FileMediaType {
    ANY = 'any',
    IMAGE = 'image',
    VIDEO = 'video',
}

export enum ImageModel {
    SEEDREAM = 'seedream',
    FLUX = 'flux',
    IMAGEN3 = 'imagen3',
    MIDJOURNEY = 'midjourney',
    DALLE3 = 'dalle3',
    STABLE = 'stable',
}

export enum VideoModel {
    RUNWAY = 'runway',
    SORA = 'sora',
    PIKA = 'pika',
    KLING = 'kling',
}

export enum AspectRatio {
    SQUARE = '1:1',
    STANDARD = '4:3',
    PORTRAIT_STANDARD = '3:4',
    WIDESCREEN = '16:9',
    PORTRAIT_WIDE = '9:16',
    PORTRAIT_23 = '2:3',
    LANDSCAPE_32 = '3:2',
}

export enum ImageQuality {
    STANDARD = 'standard',
    HD = 'hd',
    FOUR_K = '4k',
}

export enum VideoDuration {
    FOUR_S = '4s',
    EIGHT_S = '8s',
    SIXTEEN_S = '16s',
    TWENTY_FOUR_S = '24s',
}

export enum AssistantMode {
    ENHANCE = 'enhance',
    EXPAND = 'expand',
    CREATIVE = 'creative',
    PROFESSIONAL = 'professional',
    CINEMATIC = 'cinematic',
}

export enum StyleEmphasis {
    NONE = 'none',
    PHOTOREALISTIC = 'photorealistic',
    ARTISTIC = 'artistic',
    ANIME = 'anime',
    FANTASY = 'fantasy',
    SCI_FI = 'sci-fi',
}

export enum DetailLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum UpscaleFactor {
    TWO_X = 2,
    FOUR_X = 4,
    EIGHT_X = 8,
    SIXTEEN_X = 16,
}

export enum UpscaleMode {
    BALANCED = 'balanced',
    CREATIVE = 'creative',
    FAITHFUL = 'faithful',
    PRECISION = 'precision',
}

export enum UpscaleModel {
    MAGNIFIC_V2 = 'magnific_v2',
    SUPIR = 'supir',
    REAL_ESRGAN = 'real_esrgan',
    SWINIR = 'swinir',
}

export enum UpscalePreset {
    BALANCED = 'balanced',
    CINEMATIC = 'cinematic',
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape',
    FANTASY = 'fantasy',
}

export enum CameraAngle {
    FRONT = 'front',
    SIDE = 'side',
    TOP = 'top',
    BOTTOM = 'bottom',
    THREE_QUARTER = '3/4',
    CUSTOM = 'custom',
}

export enum NoteColor {
    YELLOW = 'yellow',
    GREEN = 'green',
    BLUE = 'blue',
    PINK = 'pink',
    PURPLE = 'purple',
}

export enum ConnectionType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    MEDIA = 'media',
    REFERENCE = 'reference',
    STYLE = 'style',
}
