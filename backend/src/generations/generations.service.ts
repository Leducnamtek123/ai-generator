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

  private async deductCredits(
    userId: string,
    type: 'image' | 'video' | 'upscale',
  ) {
    const costs = {
      image: 1,
      video: 5,
      upscale: 1,
    };
    const cost = costs[type] || 0;

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

    try {
      // 2. Call Provider
      const result = await provider.generateImage(dto.prompt, {
        model: dto.model,
        aspectRatio: dto.aspectRatio,
        quality: dto.quality,
        negativePrompt: dto.negativePrompt,
        seed: dto.seed,
      });

      // 3. Update Entity with result (Sync) or Provider ID (Async)
      generation.status = result.status;
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      // If the provider returned an ID (Async), we might want to store it in metadata if our ID is different
      // But usually we just track our ID.

      await this.generationsRepository.save(generation);

      // Auto-save as asset
      if (generation.resultUrl) {
        try {
          await this.assetsService.create({
            type: generation.type as any,
            url: generation.resultUrl,
            userId: generation.userId,
            projectId,
            metadata: { generationId: generation.id, ...generation.metadata },
          });
        } catch (err) {
          this.logger.error(
            `Failed to save asset for generation ${generation.id}: ${err.message}`,
          );
        }
      }

      return generation;
    } catch (error) {
      console.error(error); // Keep log
      this.logger.error(`Generation failed: ${error.message}`);
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'image');
      throw error;
    }
  }

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

    try {
      const result = await provider.generateVideo(dto.prompt, {
        model: dto.model,
        duration: dto.duration,
        aspectRatio: dto.aspectRatio,
        startImageUrl: dto.startImageUrl,
        endImageUrl: dto.endImageUrl,
      });

      generation.status = result.status;
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.generationsRepository.save(generation);

      // Auto-save as asset
      if (generation.resultUrl) {
        try {
          await this.assetsService.create({
            type: generation.type as any,
            url: generation.resultUrl,
            userId: generation.userId,
            projectId,
            metadata: { generationId: generation.id, ...generation.metadata },
          });
        } catch (err) {
          this.logger.error(
            `Failed to save asset for generation ${generation.id}: ${err.message}`,
          );
        }
      }

      return generation;
    } catch (error) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'video');
      throw error;
    }
  }

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

    try {
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

      generation.status = result.status;
      if (result.resultUrl) generation.resultUrl = result.resultUrl;

      await this.generationsRepository.save(generation);

      // Auto-save as asset
      if (generation.resultUrl) {
        try {
          await this.assetsService.create({
            type: 'image', // upscale result is image
            url: generation.resultUrl,
            userId: generation.userId,
            projectId,
            metadata: { generationId: generation.id, ...generation.metadata },
          });
        } catch (err) {
          this.logger.error(
            `Failed to save asset for generation ${generation.id}: ${err.message}`,
          );
        }
      }

      return generation;
    } catch (error) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.generationsRepository.save(generation);
      await this.refundCredits(userId, cost, 'upscale');
      throw error;
    }
  }

  async enhancePrompt(dto: EnhancePromptDto, userId: string): Promise<string> {
    const provider = this.providerRegistry.getPromptEnhancerProvider();
    this.logger.log(
      `Prompt enhancement requested by user ${userId} via ${provider.name}`,
    );
    return provider.enhancePrompt(dto.prompt, dto.style);
  }

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
      return; // Or throw
    }

    generation.status = status;
    if (resultUrl) generation.resultUrl = resultUrl;
    if (error) generation.error = error;

    await this.generationsRepository.save(generation);
  }
}
