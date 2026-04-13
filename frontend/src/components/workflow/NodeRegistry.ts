'use client';

import { WorkflowNodeType } from './types';
import { InputNode } from './nodes/InputNode';
import { ProcessNode } from './nodes/ProcessNode';
import { OutputNode } from './nodes/OutputNode';
import { TextNode } from './nodes/TextNode';
import { GeneratorNode } from './nodes/GeneratorNode';
import { AssistantNode } from './nodes/AssistantNode';
import { UpscaleNode } from './nodes/UpscaleNode';
import { MediaNode } from './nodes/MediaNode';
import { CommentNode } from './nodes/CommentNode';
import { VideoNode } from './nodes/VideoNode';
import { CameraNode } from './nodes/CameraNode';
import { StickyNoteNode } from './nodes/StickyNoteNode';
import { StickerNode } from './nodes/StickerNode';
import { GroupNode } from './nodes/GroupNode';

export const nodeTypes = {
    [WorkflowNodeType.TEXT]: TextNode,
    [WorkflowNodeType.IMAGE_GEN]: GeneratorNode,
    [WorkflowNodeType.VIDEO_GEN]: VideoNode,
    [WorkflowNodeType.ASSISTANT]: AssistantNode,
    [WorkflowNodeType.UPSCALE]: UpscaleNode,
    [WorkflowNodeType.MEDIA]: MediaNode,
    [WorkflowNodeType.COMMENT]: CommentNode,
    [WorkflowNodeType.CAMERA]: CameraNode,
    [WorkflowNodeType.STICKY_NOTE]: StickyNoteNode,
    [WorkflowNodeType.STICKER]: StickerNode,
    [WorkflowNodeType.GROUP]: GroupNode,
    // Legacy support
    input: InputNode,
    process: ProcessNode,
    output: OutputNode,
};
