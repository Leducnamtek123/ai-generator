import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  VideoOptions,
  ProviderCapability,
} from '../provider.interface';

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

/**
 * Runway ML API Adapter
 * Supports: Video Generation (Gen-3 Alpha, Gen-3 Alpha Turbo)
 */
@Injectable()
export class RunwayAdapter extends BaseProvider {
  readonly name = 'runway';
  readonly capabilities: ProviderCapability[] = ['video-generation'];

  private readonly logger = new Logger(RunwayAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.runway.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('RUNWAY_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    };
  }

  // ==================== Video Generation ====================

  async generateVideo(
    prompt: string,
    options?: VideoOptions,
  ): Promise<GenerationResult> {
    const model = options?.model || 'gen3a_turbo';
    this.logger.log(`Generating video with Runway model: ${model}`);

    try {
      const body: Record<string, any> = {
        model,
        promptText: prompt,
      };

      // Duration: 5 or 10 seconds
      if (options?.duration) {
        const seconds = parseInt(options.duration.replace('s', ''));
        body.duration = seconds <= 5 ? 5 : 10;
      } else {
        body.duration = 5;
      }

      // Aspect ratio
      if (options?.aspectRatio) {
        body.ratio = options.aspectRatio;
      }

      // Image-to-video
      if (options?.startImageUrl) {
        body.promptImage = options.startImageUrl;
      }

      const response = await this.httpService.axiosRef.post(
        `${RUNWAY_API_BASE}/image_to_video`,
        body,
        {
          headers: this.getHeaders(),
          timeout: 30000,
        },
      );

      const taskId = response.data?.id;
      if (!taskId) {
        throw new Error('No task ID returned from Runway');
      }

      this.logger.log(`Runway task created: ${taskId}`);

      // Poll for completion
      return await this.pollTask(taskId);
    } catch (error: any) {
      this.logger.error(`Runway video generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Polling ====================

  private async pollTask(
    taskId: string,
    maxRetries = 120,
    delayMs = 5000,
  ): Promise<GenerationResult> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.httpService.axiosRef.get(
          `${RUNWAY_API_BASE}/tasks/${taskId}`,
          { headers: this.getHeaders() },
        );

        const task = response.data;

        switch (task.status) {
          case 'SUCCEEDED':
            return {
              id: taskId,
              status: 'completed',
              resultUrl: task.output?.[0] || task.artifacts?.[0]?.url,
              metadata: {
                provider: 'runway',
                model: task.model,
                duration: task.duration,
              },
            };

          case 'FAILED':
            throw new Error(task.failure || task.failureCode || 'Runway task failed');

          case 'CANCELLED':
            throw new Error('Runway task was cancelled');

          default:
            this.logger.debug(
              `Polling Runway task ${taskId}... status: ${task.status} progress: ${task.progress || 0}% (${i + 1}/${maxRetries})`,
            );
        }
      } catch (error: any) {
        if (error.response?.status !== 429) {
          throw error;
        }
        // Rate limited, wait longer
        await new Promise((resolve) => setTimeout(resolve, delayMs * 2));
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Runway task ${taskId} timed out after ${maxRetries * delayMs / 1000}s`);
  }
}
