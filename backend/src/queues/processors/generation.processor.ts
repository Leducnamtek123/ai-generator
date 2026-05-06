import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { GENERATION_QUEUE } from '../queues.constants';
import { WorkflowsService } from '../../workflows/workflows.service';
import { GenerationsService } from '../../generations/generations.service';

export interface GenerationJobData {
  type:
    | 'image'
    | 'video'
    | 'upscale'
    | 'enhance'
    | 'music'
    | 'sfx'
    | 'voice'
    | 'lip-sync'
    | 'video-upscale'
    | 'bg-remove'
    | 'sketch-to-image'
    | 'variations'
    | 'camera-change'
    | 'icon-gen'
    | 'image-extend'
    | 'mockup'
    | 'skin-enhance';
  userId: string;
  nodeId?: string;
  workflowId?: string;
  params: Record<string, any>;
  callbackUrl?: string;
  projectId?: string;
}

export interface GenerationJobResult {
  success: boolean;
  generationId: string;
  outputUrl?: string;
  outputText?: string;
  error?: string;
}

@Processor(GENERATION_QUEUE)
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly generationsService: GenerationsService,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflowsService: WorkflowsService,
  ) {
    super();
  }

  async process(job: Job<GenerationJobData>): Promise<GenerationJobResult> {
    this.logger.log(`Processing job ${job.id} of type ${job.data.type}`);

    try {
      // Update progress
      await job.updateProgress(10);

      // Simulate AI generation (replace with actual provider calls)
      const result = await this.executeGeneration(job.data);

      // If part of a workflow, update workflow node state to 'processing'
      if (job.data.workflowId && job.data.nodeId) {
        await this.workflowsService.update(
          job.data.workflowId,
          job.data.userId,
          {
            nodes: (
              await this.workflowsService.findOne(job.data.workflowId)
            )?.nodes.map((node: any) =>
              node.id === job.data.nodeId
                ? {
                    ...node,
                    data: { ...node.data, status: 'processing' },
                  }
                : node,
            ),
          } as any,
        );
      }

      await job.updateProgress(100);

      this.logger.log(`Job ${job.id} submitted successfully`);
      return result;
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      // Update workflow node on failure
      if (job.data.workflowId && job.data.nodeId) {
        try {
          const patchData = {
            status: 'error',
            errorMessage: error.message,
          };
          await this.workflowsService.update(
            job.data.workflowId,
            job.data.userId,
            {
              nodes: (
                await this.workflowsService.findOne(job.data.workflowId)
              )?.nodes.map((node: any) =>
                node.id === job.data.nodeId
                  ? {
                      ...node,
                      data: { ...node.data, ...patchData },
                    }
                  : node,
              ),
            } as any,
          );
        } catch (updateErr) {
          this.logger.error('Failed to update node failure state', updateErr);
        }
      }
      throw error;
    }
  }

  private async executeGeneration(
    data: GenerationJobData,
  ): Promise<GenerationJobResult> {
    this.logger.debug(
      `Executing ${data.type} generation for user ${data.userId}`,
    );

    const params = data.params || {};

    try {
      let result: any;

      switch (data.type) {
        case 'image': {
          const gen = await this.generationsService.generateImage(
            {
              prompt: params.prompt,
              model: params.model,
              aspectRatio: params.aspectRatio,
              provider: params.provider,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            },
            data.userId,
            data.projectId,
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'music':
        case 'sfx':
        case 'voice': {
          const gen = await this.generationsService.generateAudio(
            {
              prompt: params.prompt || params.text || data.type,
              text: params.text || params.prompt,
              mode: params.mode,
              provider: params.provider,
              voiceId: params.voiceId,
              language: params.language,
              emotion: params.emotion,
              speed: params.speed,
              genre: params.genre,
              moods: params.moods,
              instruments: params.instruments,
              duration: params.duration,
              tempo: params.tempo,
              category: params.category,
              format: params.format,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            },
            data.userId,
            data.type as 'music' | 'sfx' | 'voice',
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'lip-sync':
        case 'video-upscale': {
          const gen = await this.generationsService.processVideo(
            {
              videoUrl: params.videoUrl,
              audioUrl: params.audioUrl,
              syncMode: params.syncMode,
              accuracy: params.accuracy,
              smoothing: params.smoothing,
              provider: params.provider,
              targetResolution: params.targetResolution,
              model: params.model,
              denoise: params.denoise,
              sharpen: params.sharpen,
              fpsBoost: params.fpsBoost,
              prompt: params.prompt,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            },
            data.userId,
            data.type as 'lip-sync' | 'video-upscale',
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'bg-remove':
        case 'sketch-to-image':
        case 'variations':
        case 'camera-change':
        case 'icon-gen':
        case 'image-extend':
        case 'mockup':
        case 'skin-enhance': {
          const gen = await this.generationsService.processImage(
            {
              imageUrl: params.imageUrl,
              prompt: params.prompt,
              strength: params.strength,
              provider: params.provider,
              count: params.count,
              sketchUrl: params.sketchUrl,
              style: params.style,
              fidelity: params.fidelity,
              mode: params.mode,
              edgeRefinement: params.edgeRefinement,
              movement: params.movement,
              angle: params.angle,
              size: params.size,
              color: params.color,
              backgroundColor: params.backgroundColor,
              direction: params.direction,
              pixels: params.pixels,
              designUrl: params.designUrl,
              template: params.template,
              scene: params.scene,
              level: params.level,
              preserveDetails: params.preserveDetails,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            },
            data.userId,
            data.type,
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'video': {
          const gen = await this.generationsService.generateVideo(
            {
              prompt: params.prompt,
              model: params.model,
              duration: params.duration,
              aspectRatio: params.aspectRatio,
              provider: params.provider,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            } as any,
            data.userId,
            data.projectId,
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'upscale': {
          const gen = await this.generationsService.upscaleImage(
            {
              imageUrl: params.imageUrl,
              scale: params.scale,
              provider: params.provider,
              metadata: {
                workflowId: data.workflowId,
                nodeId: data.nodeId,
              },
            } as any,
            data.userId,
            data.projectId,
          );
          result = { id: gen.id, resultUrl: gen.resultUrl };
          break;
        }
        case 'enhance': {
          const enhanced = await this.generationsService.enhancePrompt(
            {
              prompt: params.originalPrompt,
              style: params.style,
            },
            data.userId,
          );
          return {
            success: true,
            generationId: `enh_${Date.now()}`,
            outputText: enhanced,
          };
        }
        default:
          throw new Error(`Unsupported job type: ${data.type}`);
      }

      return {
        success: true,
        generationId: result?.id || `gen_${Date.now()}`,
        outputUrl: result?.resultUrl,
      };
    } catch (error: any) {
      this.logger.error(`Generation execution failed: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<GenerationJobData>) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<GenerationJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<GenerationJobData>, progress: number | object) {
    this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
  }
}
