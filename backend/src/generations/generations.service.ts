import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderRegistry } from '../providers/provider.registry';
import { CreditsService } from '../credits/credits.service';
import { AssetsService } from '../assets/assets.service';
import { GenerationEntity } from './entities/generation.entity';
import {
  GenerateImageDto,
  GenerateVideoDto,
  UpscaleImageDto,
  EnhancePromptDto,
} from './dto/generate.dto';

@Injectable()
export class GenerationsService {
  private readonly logger = new Logger(GenerationsService.name);

  constructor(
    private readonly providerRegistry: ProviderRegistry,
    @InjectRepository(GenerationEntity)
    private readonly generationsRepository: Repository<GenerationEntity>,
    private readonly creditsService: CreditsService,
    private readonly assetsService: AssetsService,
  ) {}

  async findOne(id: string): Promise<GenerationEntity> {
    const generation = await this.generationsRepository.findOne({
      where: { id },
    });
    if (!generation) {
      throw new NotFoundException(`Generation with ID ${id} not found`);
    }
    return generation;
  }

  async findAll(userId: string, options: { page: number; limit: number; type?: string; search?: string }) {
    const { page, limit, type, search } = options;
    const query = this.generationsRepository.createQueryBuilder('generation')
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
      throw new BadRequestException('You do not have permission to delete this generation');
    }
    await this.generationsRepository.delete(id);
    return true;
  }

  private async deductCredits(
    userId: string,
    type: string,
  ) {
    const costs: Record<string, number> = {
      image: 1,
      video: 5,
      upscale: 1,
      music: 2,
      sfx: 1,
      voice: 1,
      'lip-sync': 3,
      'video-upscale': 5,
      'bg-remove': 1,
      'sketch-to-image': 1,
      'variations': 1,
      'camera-change': 1,
      'icon-gen': 1,
      'image-extend': 1,
      'mockup': 1,
      'skin-enhance': 1,
    };
    const cost = costs[type] || 1;

    const balance = await this.creditsService.getBalance(userId);
    if (balance < cost) {
      throw new BadRequestException('Insufficient credits');
    }

    await this.creditsService.create({
      userId,
      amount: -cost,
      type: 'generation',
      metadata: { generationType: type },
    });

    return cost;
  }

  private async refundCredits(userId: string, amount: number, type: string) {
    if (amount <= 0) return;
    await this.creditsService.create({
      userId,
      amount: amount,
      type: 'refund',
      metadata: { reason: 'generation_failed', generationType: type },
    });
  }

  private async saveAsset(generation: GenerationEntity, projectId?: string) {
    if (!generation.resultUrl) return;

    // Map generation type to asset type
    const assetTypeMap: Record<string, 'image' | 'video' | 'audio'> = {
      image: 'image', upscale: 'image', 'bg-remove': 'image',
      'sketch-to-image': 'image', variations: 'image', 'camera-change': 'image',
      'icon-gen': 'image', 'image-extend': 'image', mockup: 'image', 'skin-enhance': 'image',
      video: 'video', 'lip-sync': 'video', 'video-upscale': 'video',
      music: 'audio', sfx: 'audio', voice: 'audio',
    };

    try {
      await this.assetsService.create({
        type: (assetTypeMap[generation.type] || 'image') as any,
        url: generation.resultUrl,
        userId: generation.userId,
        projectId,
        metadata: { generationId: generation.id, ...generation.metadata },
      });
      this.logger.log(`Auto-saved asset for generation ${generation.id}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to save asset for generation ${generation.id}: ${err.message}`,
      );
    }
  }

  // ==================== Image Generation ====================

  async generateImage(
    dto: GenerateImageDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getImageProvider();
    this.logger.log(
      `Image generation requested by user ${userId} via ${provider.name}`,
    );

    const cost = await this.deductCredits(userId, 'image');

    // 1. Create PENDING entity
    const generation = this.generationsRepository.create({
      userId,
      type: 'image',
      status: 'pending',
      prompt: dto.prompt,
      model: dto.model,
      cost: cost,
      metadata: {
        provider: provider.name,
        aspectRatio: dto.aspectRatio,
        quality: dto.quality,
        negativePrompt: dto.negativePrompt,
        seed: dto.seed,
      },
    });
    await this.generationsRepository.save(generation);

    // 2. Dispatch to provider (async, non-blocking)
    this.executeImageGeneration(generation, dto, provider, userId, cost, projectId)
      .catch((error) => {
        this.logger.error(`Image generation ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeImageGeneration(
    generation: GenerationEntity,
    dto: GenerateImageDto,
    provider: any,
    userId: string,
    cost: number,
    projectId?: string,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.generateImage(dto.prompt, {
        model: dto.model,
        aspectRatio: dto.aspectRatio,
        quality: dto.quality,
        negativePrompt: dto.negativePrompt,
        seed: dto.seed,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation, projectId);
    } catch (error: any) {
      this.logger.error(`Generation failed: ${error.message}`);
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'image');
    }
  }

  // ==================== Video Generation ====================

  async generateVideo(
    dto: GenerateVideoDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getVideoProvider();
    this.logger.log(
      `Video generation requested by user ${userId} via ${provider.name}`,
    );

    const cost = await this.deductCredits(userId, 'video');

    const generation = this.generationsRepository.create({
      userId,
      type: 'video',
      status: 'pending',
      prompt: dto.prompt,
      model: dto.model,
      cost: cost,
      metadata: {
        provider: provider.name,
        duration: dto.duration,
        aspectRatio: dto.aspectRatio,
        startImageUrl: dto.startImageUrl,
      },
    });
    await this.generationsRepository.save(generation);

    // Async execution
    this.executeVideoGeneration(generation, dto, provider, userId, cost, projectId)
      .catch((error) => {
        this.logger.error(`Video generation ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeVideoGeneration(
    generation: GenerationEntity,
    dto: GenerateVideoDto,
    provider: any,
    userId: string,
    cost: number,
    projectId?: string,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.generateVideo(dto.prompt, {
        model: dto.model,
        duration: dto.duration,
        aspectRatio: dto.aspectRatio,
        startImageUrl: dto.startImageUrl,
        endImageUrl: dto.endImageUrl,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation, projectId);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'video');
    }
  }

  // ==================== Upscale ====================

  async upscaleImage(
    dto: UpscaleImageDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getUpscaleProvider();
    this.logger.log(`Upscale requested by user ${userId} via ${provider.name}`);

    const cost = await this.deductCredits(userId, 'upscale');

    const generation = this.generationsRepository.create({
      userId,
      type: 'upscale',
      status: 'pending',
      prompt: 'Upscale',
      cost: cost,
      metadata: {
        provider: provider.name,
        sourceUrl: dto.imageUrl,
        scale: dto.scale,
        mode: dto.mode,
        model: dto.model,
        optimization: dto.optimization,
        creativity: dto.creativity,
        hdr: dto.hdr,
        resemblance: dto.resemblance,
        fractality: dto.fractality,
        engine: dto.engine,
        prompt: dto.prompt,
      },
    });
    await this.generationsRepository.save(generation);

    // Async execution
    this.executeUpscale(generation, dto, provider, userId, cost, projectId)
      .catch((error) => {
        this.logger.error(`Upscale ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeUpscale(
    generation: GenerationEntity,
    dto: UpscaleImageDto,
    provider: any,
    userId: string,
    cost: number,
    projectId?: string,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.upscaleImage(dto.imageUrl, {
        scale: dto.scale || 2,
        mode: dto.mode,
        model: dto.model,
        optimization: dto.optimization,
        creativity: dto.creativity,
        hdr: dto.hdr,
        resemblance: dto.resemblance,
        fractality: dto.fractality,
        engine: dto.engine,
        prompt: dto.prompt,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation, projectId);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'upscale');
    }
  }

  // ==================== Prompt Enhancement ====================

  async enhancePrompt(dto: EnhancePromptDto, userId: string): Promise<string> {
    const provider = this.providerRegistry.getPromptEnhancerProvider();
    this.logger.log(
      `Prompt enhancement requested by user ${userId} via ${provider.name}`,
    );
    return provider.enhancePrompt(dto.prompt, dto.style);
  }

  // ==================== Audio Generation ====================

  /**
   * Generate audio (music, sfx, voice) - Direct provider call, no n8n
   */
  async generateAudio(
    dto: Record<string, any>,
    userId: string,
    type: 'music' | 'sfx' | 'voice',
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getAudioProvider(type);
    this.logger.log(`${type} generation requested by user ${userId} via ${provider.name}`);

    const cost = await this.deductCredits(userId, type);

    const generation = this.generationsRepository.create({
      userId,
      type,
      status: 'pending',
      prompt: dto.prompt || dto.text || type,
      cost,
      metadata: { ...dto, provider: provider.name },
    });
    await this.generationsRepository.save(generation);

    // Async execution via provider
    this.executeAudioGeneration(generation, dto, provider, type, userId, cost)
      .catch((error) => {
        this.logger.error(`${type} generation ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeAudioGeneration(
    generation: GenerationEntity,
    dto: Record<string, any>,
    provider: any,
    type: 'music' | 'sfx' | 'voice',
    userId: string,
    cost: number,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.generateAudio(
        dto.prompt || dto.text || type,
        type,
        {
          model: dto.model,
          duration: dto.duration,
          voice: dto.voice,
          language: dto.language,
          format: dto.format,
        },
      );

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation);
    } catch (error: any) {
      this.logger.error(`${type} generation failed: ${error.message}`);
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, type);
    }
  }

  // ==================== Video Processing ====================

  /**
   * Process video (lip-sync, video-upscale) - Direct provider call
   */
  async processVideo(
    dto: Record<string, any>,
    userId: string,
    type: 'lip-sync' | 'video-upscale',
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getProvider('replicate'); // Replicate handles these
    this.logger.log(`${type} processing requested by user ${userId} via ${provider.name}`);

    const cost = await this.deductCredits(userId, type);

    const generation = this.generationsRepository.create({
      userId,
      type,
      status: 'pending',
      prompt: dto.prompt || type,
      cost,
      metadata: { ...dto, provider: provider.name },
    });
    await this.generationsRepository.save(generation);

    // Async execution
    this.executeVideoProcessing(generation, dto, provider, type, userId, cost)
      .catch((error) => {
        this.logger.error(`${type} processing ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeVideoProcessing(
    generation: GenerationEntity,
    dto: Record<string, any>,
    provider: any,
    type: string,
    userId: string,
    cost: number,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.processImage({
        type,
        imageUrl: dto.videoUrl || dto.imageUrl,
        prompt: dto.prompt,
        ...dto,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, type);
    }
  }

  // ==================== Image Processing ====================

  /**
   * Process image (bg-remove, sketch-to-image, variations, etc.) - Direct provider call
   */
  async processImage(
    dto: Record<string, any>,
    userId: string,
    type: string,
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getImageProcessingProvider(type);
    this.logger.log(`${type} processing requested by user ${userId} via ${provider.name}`);

    const cost = await this.deductCredits(userId, type);

    const generation = this.generationsRepository.create({
      userId,
      type,
      status: 'pending',
      prompt: dto.prompt || type,
      cost,
      metadata: { ...dto, provider: provider.name },
    });
    await this.generationsRepository.save(generation);

    // Async execution
    this.executeImageProcessing(generation, dto, provider, type, userId, cost)
      .catch((error) => {
        this.logger.error(`${type} processing ${generation.id} failed: ${error.message}`);
      });

    return generation;
  }

  private async executeImageProcessing(
    generation: GenerationEntity,
    dto: Record<string, any>,
    provider: any,
    type: string,
    userId: string,
    cost: number,
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.generationsRepository.save(generation);

      const result = await provider.processImage({
        type,
        imageUrl: dto.imageUrl,
        prompt: dto.prompt,
        strength: dto.strength,
        ...dto,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);
      await this.saveAsset(generation);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, type);
    }
  }

  // ==================== Callback (kept for backward compat) ====================

  async handleCallback(
    id: string,
    status: string,
    resultUrl?: string,
    error?: string,
  ): Promise<void> {
    this.logger.log(`Callback received for generation ${id}: ${status}`);

    const generation = await this.generationsRepository.findOne({
      where: { id },
    });
    if (!generation) {
      this.logger.warn(`Generation ${id} not found during callback`);
      return;
    }

    generation.status = status;
    if (resultUrl) generation.resultUrl = resultUrl;
    if (error) generation.error = error;

    await this.generationsRepository.save(generation);

    // Auto-save asset on successful completion
    if (status === 'completed' && resultUrl) {
      await this.saveAsset(generation);
    }

    // Refund credits on failure
    if (status === 'failed' && generation.cost) {
      await this.refundCredits(generation.userId, generation.cost, generation.type);
    }
  }
}
