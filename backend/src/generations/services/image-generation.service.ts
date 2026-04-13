import { Injectable, Logger } from '@nestjs/common';
import { GenerationBaseService } from './generation-base.service';
import { ProviderRegistry } from '../../providers/provider.registry';
import { GenerateImageDto, UpscaleImageDto } from '../dto/generate.dto';
import { GenerationEntity } from '../entities/generation.entity';

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly providerRegistry: ProviderRegistry,
  ) {}

  async generateImage(dto: GenerateImageDto, userId: string, projectId?: string): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getImageProvider();
    const cost = await this.baseService.deductCredits(userId, 'image');

    const generation = await this.baseService.create({
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

    this.executeImageGeneration(generation, dto, provider, userId, cost, projectId)
      .catch((error) => this.logger.error(`Image generation ${generation.id} failed: ${error.message}`));

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
      await this.baseService.save(generation);

      const result = await provider.generateImage(dto.prompt, {
        model: dto.model,
        aspectRatio: dto.aspectRatio,
        quality: dto.quality,
        negativePrompt: dto.negativePrompt,
        seed: dto.seed,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata) generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.baseService.save(generation);
      await this.baseService.saveAsset(generation, projectId);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      await this.baseService.refundCredits(userId, cost, 'image');
    }
  }

  async upscaleImage(dto: UpscaleImageDto, userId: string, projectId?: string): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getUpscaleProvider();
    const cost = await this.baseService.deductCredits(userId, 'upscale');

    const generation = await this.baseService.create({
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

    this.executeUpscale(generation, dto, provider, userId, cost, projectId)
      .catch((error) => this.logger.error(`Upscale ${generation.id} failed: ${error.message}`));

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
      await this.baseService.save(generation);

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

      await this.baseService.save(generation);
      await this.baseService.saveAsset(generation, projectId);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      await this.baseService.refundCredits(userId, cost, 'upscale');
    }
  }

  async processImage(dto: Record<string, any>, userId: string, type: string): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getImageProcessingProvider(type);
    const cost = await this.baseService.deductCredits(userId, type);

    const generation = await this.baseService.create({
      userId,
      type,
      status: 'pending',
      prompt: dto.prompt || type,
      cost,
      metadata: { ...dto, provider: provider.name },
    });

    this.executeImageProcessing(generation, dto, provider, type, userId, cost)
      .catch((error) => this.logger.error(`${type} processing ${generation.id} failed: ${error.message}`));

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
      await this.baseService.save(generation);

      const result = await provider.processImage({
        type,
        imageUrl: dto.imageUrl,
        prompt: dto.prompt,
        strength: dto.strength,
        ...dto,
      });

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata) generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.baseService.save(generation);
      await this.baseService.saveAsset(generation);
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      await this.baseService.refundCredits(userId, cost, type);
    }
  }
}
