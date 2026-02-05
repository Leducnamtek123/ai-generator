import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { GENERATION_QUEUE } from '../queues.constants';
import { WorkflowsService } from '../../workflows/workflows.service';
import { GenerationsService } from '../../generations/generations.service';

export interface GenerationJobData {
  type: 'image' | 'video' | 'upscale' | 'enhance';
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

      // If part of a workflow, update workflow node state
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
                    data: {
                      ...node.data,
                      status: 'success',
                      previewUrl: result.outputUrl || node.data.previewUrl,
                      enhancedText: result.outputText || node.data.enhancedText,
                      previewText: result.outputText || node.data.previewText, // some nodes might use different keys
                    },
                  }
                : node,
            ),
          } as any,
        );
      }

      await job.updateProgress(100);

      this.logger.log(`Job ${job.id} completed successfully`);
      return result;
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      // Update workflow node on failure
      if (job.data.workflowId && job.data.nodeId) {
        try {
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
                      data: {
                        ...node.data,
                        status: 'error',
                        errorMessage: error.message,
                      },
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
            },
            data.userId,
            data.projectId,
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
