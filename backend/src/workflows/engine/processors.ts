import { WorkflowNode } from './types';

/**
 * Context passed to node processors during execution
 */
export interface ProcessorContext {
  workflowId: string;
  userId: string;
  nodeInputs: Map<string, any>;
  projectId?: string;
  runId: string;
}

/**
 * Result from a node processor
 */
export interface ProcessorResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

function readInputValue(context: ProcessorContext, ...keys: string[]): string {
  for (const key of keys) {
    const value = context.nodeInputs.get(key);
    const direct = firstString(value);
    if (direct) return direct;

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const nested = firstString(
        record.text,
        record.prompt,
        record.originalPrompt,
        record.enhancedText,
        record.value,
        record.imageUrl,
        record.inputImageUrl,
        record.startImageUrl,
        record.videoUrl,
        record.inputVideoUrl,
        record.previewUrl,
        record.resultUrl,
        record.referenceImageUrl,
        record.reference,
        record.content,
        record.name,
        record.label,
      );
      if (nested) return nested;
    }
  }
  return '';
}

function readNodeValue(node: WorkflowNode, ...keys: string[]): string {
  const data = node.data as Record<string, unknown>;
  return firstString(...keys.map((key) => data[key]));
}

/**
 * Base interface for all node processors
 */
export interface NodeProcessor {
  readonly nodeType: string;
  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult>;
}

/**
 * Text node processor - passes text through
 */
export class TextNodeProcessor implements NodeProcessor {
  readonly nodeType = 'text';

  process(
    node: WorkflowNode,
    _context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const text = firstString(
      node.data.content,
      node.data.text,
      node.data.label,
    );
    return Promise.resolve({
      success: true,
      output: { text, prompt: text },
    });
  }
}

export class ReferenceNodeProcessor implements NodeProcessor {
  constructor(readonly nodeType: string) {}

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const text =
      readInputValue(context, 'text', 'prompt', 'reference') ||
      readNodeValue(
        node,
        'content',
        'text',
        'inputText',
        'prompt',
        'name',
        'label',
      );
    const imageUrl =
      readInputValue(
        context,
        'image',
        'imageUrl',
        'inputImageUrl',
        'startImageUrl',
        'previewUrl',
        'resultUrl',
      ) ||
      readNodeValue(
        node,
        'inputImageUrl',
        'previewUrl',
        'outputUrl',
        'mediaUrl',
      );
    const videoUrl =
      readInputValue(
        context,
        'video',
        'videoUrl',
        'inputVideoUrl',
        'previewUrl',
        'resultUrl',
      ) ||
      readNodeValue(
        node,
        'inputVideoUrl',
        'videoUrl',
        'previewUrl',
        'outputUrl',
      );
    const reference =
      text ||
      imageUrl ||
      videoUrl ||
      readNodeValue(node, 'name', 'label', 'content', 'text');

    return Promise.resolve({
      success: true,
      output: {
        reference,
        text: text || reference,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
        label: node.data.label,
        name: node.data.name,
      },
    });
  }
}

/**
 * Image generation node processor
 */
export class ImageGenNodeProcessor implements NodeProcessor {
  readonly nodeType = 'image_gen';

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    // Get input from connected text node
    const inputText =
      readInputValue(context, 'prompt', 'text', 'inputText') ||
      firstString(node.data.prompt, node.data.inputPrompt, node.data.text);
    const referenceImageUrl =
      readInputValue(
        context,
        'image',
        'referenceImageUrl',
        'startImageUrl',
        'inputImageUrl',
      ) ||
      firstString(
        node.data.inputReference,
        node.data.inputImageUrl,
        node.data.inputUrl,
        node.data.previewUrl,
      );

    // Integrated with GenerationProcessor via BullMQ queueing
    // For now, queue a job and return pending status
    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        prompt: inputText,
        text: inputText,
        referenceImageUrl,
        inputImageUrl: referenceImageUrl,
        model: node.data.model || 'seedream',
        aspectRatio: node.data.aspectRatio || '1:1',
      },
    });
  }
}

/**
 * Video generation node processor
 */
export class VideoGenNodeProcessor implements NodeProcessor {
  readonly nodeType = 'video_gen';

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const inputText =
      readInputValue(context, 'prompt', 'text', 'inputText') ||
      firstString(node.data.prompt, node.data.inputPrompt, node.data.text);
    const startImageUrl =
      readInputValue(
        context,
        'image',
        'startImageUrl',
        'inputImageUrl',
        'imageUrl',
      ) ||
      firstString(
        node.data.inputImage,
        node.data.startImageUrl,
        node.data.inputImageUrl,
        node.data.previewUrl,
      );

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        prompt: inputText,
        text: inputText,
        startImageUrl,
        inputImageUrl: startImageUrl,
        model: node.data.model || 'runway',
        duration: node.data.duration || '8s',
      },
    });
  }
}

/**
 * Upscale node processor
 */
export class UpscaleNodeProcessor implements NodeProcessor {
  readonly nodeType = 'upscale';

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const inputImage =
      readInputValue(
        context,
        'image',
        'inputImageUrl',
        'startImageUrl',
        'imageUrl',
      ) || firstString(node.data.inputImageUrl, node.data.previewUrl);

    if (!inputImage) {
      return Promise.resolve({
        success: false,
        error: 'No input image provided',
      });
    }

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        imageUrl: inputImage,
        inputImageUrl: inputImage,
        scale: node.data.scale || '2x',
      },
    });
  }
}

/**
 * AI Assistant / Prompt Enhancer node processor
 */
export class AssistantNodeProcessor implements NodeProcessor {
  readonly nodeType = 'assistant';

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const inputText =
      readInputValue(context, 'text', 'prompt', 'inputText') ||
      firstString(
        node.data.inputText,
        node.data.inputPrompt,
        node.data.text,
        node.data.prompt,
      );

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        originalPrompt: inputText,
        text: inputText,
        style: node.data.styleEmphasis || 'enhance',
      },
    });
  }
}

/**
 * Generic tool node processor
 */
export class ToolNodeProcessor implements NodeProcessor {
  readonly nodeType = 'tool';

  process(
    node: WorkflowNode,
    context: ProcessorContext,
  ): Promise<ProcessorResult> {
    const toolType = node.data.toolType || 'image_gen';
    const prompt =
      readInputValue(context, 'text', 'prompt', 'inputText') ||
      firstString(node.data.prompt, node.data.inputText);

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        toolType,
        prompt,
        text: prompt,
        ...node.data,
      },
    });
  }
}
