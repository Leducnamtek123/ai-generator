import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VISUAL_FLOW_QUEUE } from '../queues/queues.constants';
import { QueueReliabilityService } from '../queues/queue-reliability.service';
import { VisualFlowService } from './visual-flow.service';
import { GenerationsService } from '../generations/generations.service';
import { VisualFlowEventsService } from './services/visual-flow-events.service';

export interface VFJobData {
  action: 'generate_ref' | 'generate_scene_image' | 'generate_scene_video';
  projectId: string;
  userId: string;
  videoId?: string;
  characterId?: string;
  sceneId?: string;
  orientation?: 'VERTICAL' | 'HORIZONTAL';
  prompt?: string;
}

@Processor(VISUAL_FLOW_QUEUE)
export class VisualFlowProcessor extends WorkerHost {
  private readonly logger = new Logger(VisualFlowProcessor.name);

  constructor(
    private readonly visualFlowService: VisualFlowService,
    private readonly generationsService: GenerationsService,
    private readonly eventsService: VisualFlowEventsService,
    private readonly queueReliabilityService: QueueReliabilityService,
  ) {
    super();
  }

  async process(job: Job<VFJobData>): Promise<any> {
    this.logger.log(`Processing VF job ${job.id} - Action: ${job.data.action}`);

    switch (job.data.action) {
      case 'generate_ref':
        return this.processGenerateRef(job);
      case 'generate_scene_image':
        return this.processGenerateSceneImage(job);
      case 'generate_scene_video':
        return this.processGenerateSceneVideo(job);
      default:
        throw new Error(`Unknown action: ${job.data.action}`);
    }
  }

  private getRequestId(job: Job<VFJobData>): string {
    return String(job.id ?? `${job.data.action}:${job.data.projectId}`);
  }

  private buildJobMetadata(
    job: Job<VFJobData>,
    extra: Record<string, any> = {},
  ): Record<string, any> {
    return {
      requestId: this.getRequestId(job),
      vfAction: job.data.action,
      projectId: job.data.projectId,
      ...extra,
    };
  }

  private async processGenerateRef(job: Job<VFJobData>) {
    const { projectId, userId, characterId } = job.data;
    if (!characterId) throw new Error('characterId missing');

    const project = await this.visualFlowService.findOneProject(
      projectId,
      userId,
    );
    const char = project.characters?.find((c) => c.id === characterId);
    if (!char) throw new Error(`Character ${characterId} not found`);

    try {
      char.refStatus = 'PROCESSING';
      await this.visualFlowService.saveCharacter(char);

      this.eventsService.emitCharacterUpdate(projectId, char.id, {
        refStatus: 'PROCESSING',
      });

      // Generate Image
      const generation = await this.generationsService.generateImage(
        {
          prompt: char.description
            ? `Reference portrait of: ${char.description}. Clean studio background, no text.`
            : `Reference image of ${char.name}`,
          aspectRatio: '1:1',
          quality: 'hd',
          metadata: this.buildJobMetadata(job, { characterId: char.id }),
        },
        userId,
        projectId,
      );

      // We wait for it if it returns completed synchronously, otherwise we'd need callback polling.
      // Assuming generateImage returns immediately but we can mock completion:
      char.refStatus =
        generation.status === 'completed' ? 'COMPLETED' : 'PROCESSING';
      if (generation.resultUrl) {
        char.referenceImageUrl = generation.resultUrl;
        char.mediaId = generation.id;
        char.refStatus = 'COMPLETED';
      }

      await this.visualFlowService.saveCharacter(char);

      this.eventsService.emitCharacterUpdate(projectId, char.id, {
        refStatus: char.refStatus,
        referenceImageUrl: char.referenceImageUrl,
      });

      return { characterId: char.id, status: char.refStatus };
    } catch (err: any) {
      this.logger.error(
        `Failed to generate ref for character ${char.id}: ${err.message}`,
      );
      char.refStatus = 'FAILED';
      await this.visualFlowService.saveCharacter(char);
      this.eventsService.emitCharacterUpdate(projectId, char.id, {
        refStatus: 'FAILED',
        error: err.message,
      });
      throw err;
    }
  }

  private async processGenerateSceneImage(job: Job<VFJobData>) {
    const { projectId, videoId, userId, sceneId, orientation, prompt } =
      job.data;
    if (!sceneId || !videoId || !orientation || !prompt)
      throw new Error('Missing params');

    const scenes = await this.visualFlowService.getScenes(videoId);
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} not found`);

    const isVertical = orientation === 'VERTICAL';

    try {
      if (isVertical) {
        scene.verticalImageStatus = 'PROCESSING';
      } else {
        scene.horizontalImageStatus = 'PROCESSING';
      }
      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalImageStatus: scene.verticalImageStatus,
        horizontalImageStatus: scene.horizontalImageStatus,
      });

      const generation = await this.generationsService.generateImage(
        {
          prompt,
          aspectRatio: isVertical ? '9:16' : '16:9',
          quality: 'hd',
          metadata: this.buildJobMetadata(job, {
            videoId,
            sceneId: scene.id,
            orientation,
          }),
        },
        userId,
        projectId,
      );

      if (isVertical) {
        scene.verticalMediaId = generation.id;
        if (generation.resultUrl) {
          scene.verticalImageUrl = generation.resultUrl;
          scene.verticalImageStatus = 'COMPLETED';
        }
      } else {
        scene.horizontalMediaId = generation.id;
        if (generation.resultUrl) {
          scene.horizontalImageUrl = generation.resultUrl;
          scene.horizontalImageStatus = 'COMPLETED';
        }
      }

      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalImageStatus: scene.verticalImageStatus,
        horizontalImageStatus: scene.horizontalImageStatus,
        verticalImageUrl: scene.verticalImageUrl,
        horizontalImageUrl: scene.horizontalImageUrl,
      });

      return { sceneId: scene.id, status: 'COMPLETED' };
    } catch (err: any) {
      if (isVertical) scene.verticalImageStatus = 'FAILED';
      else scene.horizontalImageStatus = 'FAILED';
      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalImageStatus: scene.verticalImageStatus,
        horizontalImageStatus: scene.horizontalImageStatus,
        error: err.message,
      });
      throw err;
    }
  }

  private async processGenerateSceneVideo(job: Job<VFJobData>) {
    const { projectId, videoId, userId, sceneId, orientation, prompt } =
      job.data;
    if (!sceneId || !videoId || !orientation || !prompt)
      throw new Error('Missing params');

    const scenes = await this.visualFlowService.getScenes(videoId);
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} not found`);

    const isVertical = orientation === 'VERTICAL';

    try {
      if (isVertical) {
        scene.verticalVideoStatus = 'PROCESSING';
      } else {
        scene.horizontalVideoStatus = 'PROCESSING';
      }
      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalVideoStatus: scene.verticalVideoStatus,
        horizontalVideoStatus: scene.horizontalVideoStatus,
      });

      const startImageUrl = isVertical
        ? scene.verticalImageUrl
        : scene.horizontalImageUrl;

      const generation = await this.generationsService.generateVideo(
        {
          prompt: prompt,
          aspectRatio: isVertical ? '9:16' : '16:9',
          startImageUrl: startImageUrl,
          metadata: this.buildJobMetadata(job, {
            videoId,
            sceneId: scene.id,
            orientation,
          }),
        },
        userId,
        projectId,
      );

      if (isVertical) {
        scene.verticalVideoMediaId = generation.id;
        if (generation.resultUrl) {
          scene.verticalVideoUrl = generation.resultUrl;
          scene.verticalVideoStatus = 'COMPLETED';
        }
      } else {
        scene.horizontalVideoMediaId = generation.id;
        if (generation.resultUrl) {
          scene.horizontalVideoUrl = generation.resultUrl;
          scene.horizontalVideoStatus = 'COMPLETED';
        }
      }

      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalVideoStatus: scene.verticalVideoStatus,
        horizontalVideoStatus: scene.horizontalVideoStatus,
        verticalVideoUrl: scene.verticalVideoUrl,
        horizontalVideoUrl: scene.horizontalVideoUrl,
      });

      return { sceneId: scene.id, status: 'COMPLETED' };
    } catch (err: any) {
      if (isVertical) scene.verticalVideoStatus = 'FAILED';
      else scene.horizontalVideoStatus = 'FAILED';
      await this.visualFlowService.saveScene(scene);

      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalVideoStatus: scene.verticalVideoStatus,
        horizontalVideoStatus: scene.horizontalVideoStatus,
        error: err.message,
      });
      throw err;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`VF Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`VF Job ${job.id} failed: ${error.message}`);
    await this.queueReliabilityService.archiveFailure(
      VISUAL_FLOW_QUEUE,
      job,
      error,
      {
        action: job.data.action,
        projectId: job.data.projectId,
        userId: job.data.userId,
        videoId: job.data.videoId,
        characterId: job.data.characterId,
        sceneId: job.data.sceneId,
      },
    );
  }
}
