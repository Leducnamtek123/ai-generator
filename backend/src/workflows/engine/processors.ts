import { WorkflowNode } from './types';

/**
 * Context passed to node processors during execution
 */
export interface ProcessorContext {
  workflowId: string;
  userId: string;
  nodeInputs: Map<string, any>;
  projectId?: string;
}

/**
 * Result from a node processor
 */
export interface ProcessorResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
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
    const text = node.data.content || node.data.text || '';
    return Promise.resolve({
      success: true,
      output: { text },
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
      context.nodeInputs.get('prompt') || node.data.prompt || '';

    // TODO: Integrate with ProviderRegistry for actual generation
    // For now, queue a job and return pending status
    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        prompt: inputText,
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
      context.nodeInputs.get('prompt') || node.data.prompt || '';

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        prompt: inputText,
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
    const inputImage = context.nodeInputs.get('image');

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
      context.nodeInputs.get('text') || node.data.inputPrompt || '';

    return Promise.resolve({
      success: true,
      output: {
        status: 'queued',
        originalPrompt: inputText,
        style: node.data.styleEmphasis || 'enhance',
      },
    });
  }
}
