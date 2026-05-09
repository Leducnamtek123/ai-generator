import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerationEntity } from './entities/generation.entity';
import {
  GenerateImageDto,
  GenerateVideoDto,
  UpscaleImageDto,
  EnhancePromptDto,
} from './dto/generate.dto';
import { GenerationBaseService } from './services/generation-base.service';
import { ImageGenerationService } from './services/image-generation.service';
import { VideoGenerationService } from './services/video-generation.service';
import { AudioGenerationService } from './services/audio-generation.service';
import { ProviderRegistry } from '../providers/provider.registry';
import { GenerationEventsService } from './services/generation-events.service';
import { AllConfigType } from '../config/config.type';
import crypto from 'crypto';

const GENERATION_TYPE_BY_ALIAS: Record<string, string | string[]> = {
  image: 'image',
  'image-generator': 'image',
  video: 'video',
  'video-generator': 'video',
  music: 'music',
  'music-generator': 'music',
  voice: 'voice',
  'voice-generator': 'voice',
  sfx: 'sfx',
  'sfx-generator': 'sfx',
  upscale: 'upscale',
  'image-upscaler': 'upscale',
  'video-upscaler': 'video-upscale',
  'bg-remover': 'bg-remove',
  'sketch-to-image': 'sketch-to-image',
  variations: 'variations',
  'camera-change': 'camera-change',
  'icon-generator': 'icon-gen',
  'image-extend': 'image-extend',
  mockup: 'mockup',
  'mockup-generator': 'mockup',
  'skin-enhance': 'skin-enhance',
  audio: ['music', 'sfx', 'voice'],
  all: '',
};

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly imageService: ImageGenerationService,
    private readonly videoService: VideoGenerationService,
    private readonly audioService: AudioGenerationService,
    private readonly providerRegistry: ProviderRegistry,
    private readonly eventsService: GenerationEventsService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async findOne(id: string, userId?: string): Promise<GenerationEntity> {
    const generation = await this.baseService.findOne(id);

    if (userId && generation.userId !== userId) {
      throw new NotFoundException('Generation not found');
    }

    return generation;
  }

  async findAll(
    userId: string,
    options: { page: number; limit: number; type?: string; search?: string },
  ) {
    const { page, limit, type, search } = options;
    const repo = this.baseService.getRepository();
    const query = repo
      .createQueryBuilder('generation')
      .where('generation.userId = :userId', { userId })
      .orderBy('generation.createdAt', 'DESC');

    if (type && type !== 'all') {
      const mappedType = GENERATION_TYPE_BY_ALIAS[type] ?? type;
      if (Array.isArray(mappedType)) {
        query.andWhere('generation.type IN (:...types)', { types: mappedType });
      } else if (mappedType) {
        query.andWhere('generation.type = :type', { type: mappedType });
      }
    }

    if (search) {
      query.andWhere('generation.prompt ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    };
  }

  listProviders() {
    return this.providerRegistry.getProviderInfo();
  }

  async remove(id: string, userId: string) {
    const generation = await this.findOne(id, userId);
    if (generation.userId !== userId) {
      throw new Error('You do not have permission to delete this generation');
    }
    await this.baseService.getRepository().delete(id);
    return true;
  }

  // Delegate to specific services
  async generateImage(
    dto: GenerateImageDto,
    userId: string,
    projectId?: string,
  ) {
    return this.imageService.generateImage(dto, userId, projectId);
  }

  async generateVideo(
    dto: GenerateVideoDto,
    userId: string,
    projectId?: string,
  ) {
    return this.videoService.generateVideo(dto, userId, projectId);
  }

  async upscaleImage(dto: UpscaleImageDto, userId: string, projectId?: string) {
    return this.imageService.upscaleImage(dto, userId, projectId);
  }

  async generateAudio(
    dto: Record<string, any>,
    userId: string,
    type: 'music' | 'sfx' | 'voice',
  ) {
    return this.audioService.generateAudio(dto, userId, type);
  }

  async processVideo(
    dto: Record<string, any>,
    userId: string,
    type: 'lip-sync' | 'video-upscale',
  ) {
    return this.videoService.processVideo(dto, userId, type);
  }

  async processImage(dto: Record<string, any>, userId: string, type: string) {
    return this.imageService.processImage(dto, userId, type);
  }

  async enhancePrompt(dto: EnhancePromptDto, _userId: string): Promise<string> {
    const provider = this.providerRegistry.getPromptEnhancerProvider();
    return provider.enhancePrompt(dto.prompt, dto.style);
  }

  async handleCallback(
    id: string,
    status: string,
    resultUrl?: string,
    error?: string,
    callbackSecret?: string,
  ): Promise<void> {
    const expectedSecret = this.configService.get(
      'app.generationCallbackSecret',
      {
        infer: true,
      },
    );

    if (expectedSecret) {
      if (!callbackSecret || callbackSecret !== expectedSecret) {
        throw new UnauthorizedException('Invalid generation callback secret');
      }
    }

    const generation = await this.findOne(id);
    const callbackHash = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          id,
          status,
          resultUrl: resultUrl ?? null,
          error: error ?? null,
        }),
      )
      .digest('hex');

    const metadata = (generation.metadata ?? {}) as Record<string, any>;
    const existingCallbackHash = metadata.callback?.hash;

    if (existingCallbackHash === callbackHash) {
      return;
    }

    if (generation.status === 'completed' || generation.status === 'failed') {
      metadata.callback = {
        ...(metadata.callback ?? {}),
        hash: callbackHash,
        ignoredAt: new Date().toISOString(),
        ignoredReason: 'terminal_state',
      };
      generation.metadata = metadata;
      await this.baseService.save(generation);
      return;
    }

    generation.status = status;
    if (resultUrl) generation.resultUrl = resultUrl;
    if (error) generation.error = error;
    metadata.callback = {
      ...(metadata.callback ?? {}),
      hash: callbackHash,
      receivedAt: new Date().toISOString(),
    };
    generation.metadata = metadata;

    await this.baseService.save(generation);

    const creditTransactionId = generation.metadata?.creditTransactionId as
      | string
      | undefined;

    if (status === 'completed' && resultUrl) {
      await this.baseService.saveAsset(generation);
      if (creditTransactionId) {
        try {
          await this.baseService.captureCredits(
            generation.userId,
            creditTransactionId,
            generation.type,
          );
        } catch (captureError: any) {
          this.logger.error(
            `Failed to capture credits for callback ${generation.id}: ${captureError.message}`,
          );
        }
      }
    }

    if (status === 'failed' && generation.cost) {
      if (creditTransactionId) {
        try {
          await this.baseService.releaseCredits(
            generation.userId,
            creditTransactionId,
            generation.type,
          );
        } catch (releaseError: any) {
          this.logger.error(
            `Failed to release credits for callback ${generation.id}: ${releaseError.message}`,
          );
        }
      } else {
        await this.baseService.refundCredits(
          generation.userId,
          generation.cost,
          generation.type,
        );
      }
    }

    // Notify other services (e.g. VisualFlow)
    this.eventsService.emitUpdate(generation, generation.metadata?.projectId);
  }
}
