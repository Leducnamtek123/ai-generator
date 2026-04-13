import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly imageService: ImageGenerationService,
    private readonly videoService: VideoGenerationService,
    private readonly audioService: AudioGenerationService,
    private readonly providerRegistry: ProviderRegistry,
  ) {}

  async findOne(id: string): Promise<GenerationEntity> {
    return this.baseService.findOne(id);
  }

  async findAll(userId: string, options: { page: number; limit: number; type?: string; search?: string }) {
    const { page, limit, type, search } = options;
    const repo = this.baseService.getRepository();
    const query = repo.createQueryBuilder('generation')
      .where('generation.userId = :userId', { userId })
      .orderBy('generation.createdAt', 'DESC');

    if (type) {
      if (type === 'image') query.andWhere('generation.type LIKE :type', { type: '%image%' });
      else if (type === 'video') query.andWhere('generation.type LIKE :type', { type: '%video%' });
      else if (type === 'audio') query.andWhere('generation.type IN (:...types)', { types: ['music', 'sfx', 'voice'] });
      else query.andWhere('generation.type = :type', { type });
    }

    if (search) {
      query.andWhere('generation.prompt ILIKE :search', { search: `%${search}%` });
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

  async remove(id: string, userId: string) {
    const generation = await this.findOne(id);
    if (generation.userId !== userId) {
      throw new Error('You do not have permission to delete this generation');
    }
    await this.baseService.getRepository().delete(id);
    return true;
  }

  // Delegate to specific services
  async generateImage(dto: GenerateImageDto, userId: string, projectId?: string) {
    return this.imageService.generateImage(dto, userId, projectId);
  }

  async generateVideo(dto: GenerateVideoDto, userId: string, projectId?: string) {
    return this.videoService.generateVideo(dto, userId, projectId);
  }

  async upscaleImage(dto: UpscaleImageDto, userId: string, projectId?: string) {
    return this.imageService.upscaleImage(dto, userId, projectId);
  }

  async generateAudio(dto: Record<string, any>, userId: string, type: 'music' | 'sfx' | 'voice') {
    return this.audioService.generateAudio(dto, userId, type);
  }

  async processVideo(dto: Record<string, any>, userId: string, type: 'lip-sync' | 'video-upscale') {
    return this.videoService.processVideo(dto, userId, type);
  }

  async processImage(dto: Record<string, any>, userId: string, type: string) {
    return this.imageService.processImage(dto, userId, type);
  }

  async enhancePrompt(dto: EnhancePromptDto, userId: string): Promise<string> {
    const provider = this.providerRegistry.getPromptEnhancerProvider();
    return provider.enhancePrompt(dto.prompt, dto.style);
  }

  async handleCallback(id: string, status: string, resultUrl?: string, error?: string): Promise<void> {
    const generation = await this.findOne(id);
    generation.status = status;
    if (resultUrl) generation.resultUrl = resultUrl;
    if (error) generation.error = error;

    await this.baseService.save(generation);

    if (status === 'completed' && resultUrl) {
      await this.baseService.saveAsset(generation);
    }

    if (status === 'failed' && generation.cost) {
      await this.baseService.refundCredits(generation.userId, generation.cost, generation.type);
    }
  }
}
