import { Injectable, Logger } from '@nestjs/common';
import { GenerationBaseService } from './generation-base.service';
import { ProviderRegistry } from '../../providers/provider.registry';
import { GenerateImageDto, UpscaleImageDto } from '../dto/generate.dto';
import { GenerationEntity } from '../entities/generation.entity';
import { GenerationEventsService } from './generation-events.service';

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly providerRegistry: ProviderRegistry,
    private readonly eventsService: GenerationEventsService,
  ) {}

  private getPreferredProvider(provider?: string, fallback?: string) {
    return provider?.trim() || fallback || undefined;
  }

  async generateImage(dto: GenerateImageDto, userId: string, projectId?: string): Promise<GenerationEntity> {
    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getImageProvider().name,
    );
    const reservation = await this.baseService.reserveCredits(userId, 'image');

    let generation: GenerationEntity;
    try {
      generation = await this.baseService.create({
        userId,
        type: 'image',
        status: 'pending',
        prompt: dto.prompt,
        model: dto.model,
        cost: reservation.amount,
        metadata: {
          provider: preferredProvider,
          aspectRatio: dto.aspectRatio,
          quality: dto.quality,
          negativePrompt: dto.negativePrompt,
          seed: dto.seed,
          projectId,
          creditTransactionId: reservation.transactionId,
          creditReservationId: reservation.referenceId,
          ...(dto.metadata || {}),
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(userId, reservation.transactionId, 'image');
      throw error;
    }

    this.executeImageGeneration(
      generation,
      dto,
      preferredProvider,
      userId,
      reservation,
      projectId,
    ).catch((error) =>
      this.logger.error(`Image generation ${generation.id} failed: ${error.message}`),
    );

    return generation;
  }

  private async executeImageGeneration(
    generation: GenerationEntity,
    dto: GenerateImageDto,
    preferredProvider: string | undefined,
    userId: string,
    reservation: { transactionId: string; amount: number },
    projectId?: string,
  ): Promise<void> {
    try {
      const result = await this.providerRegistry.executeWithFallback(
        'image-generation',
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.generateImage(dto.prompt, {
            model: dto.model,
            aspectRatio: dto.aspectRatio,
            quality: dto.quality,
            negativePrompt: dto.negativePrompt,
            seed: dto.seed,
          });

          generation.status = providerResult.status || 'completed';
          if (providerResult.resultUrl) generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              'image',
            );
          } catch (captureError: any) {
            this.logger.error(
              `Failed to capture credits for image generation ${generation.id}: ${captureError.message}`,
            );
          }
          await this.baseService.saveAsset(generation, projectId);
          this.eventsService.emitUpdate(generation, projectId);
          return providerResult;
        },
        preferredProvider,
      );

      if (!result) {
        throw new Error('Image generation did not return a result');
      }
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      try {
        await this.baseService.releaseCredits(
          userId,
          reservation.transactionId,
          'image',
        );
      } catch (releaseError: any) {
        this.logger.error(
          `Failed to release credits for image generation ${generation.id}: ${releaseError.message}`,
        );
      }
      this.eventsService.emitUpdate(generation, projectId);
    }
  }

  async upscaleImage(dto: UpscaleImageDto, userId: string, projectId?: string): Promise<GenerationEntity> {
    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getUpscaleProvider().name,
    );
    const reservation = await this.baseService.reserveCredits(userId, 'upscale');

    let generation: GenerationEntity;
    try {
      generation = await this.baseService.create({
        userId,
        type: 'upscale',
        status: 'pending',
        prompt: 'Upscale',
        cost: reservation.amount,
        metadata: {
          provider: preferredProvider,
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
          creditTransactionId: reservation.transactionId,
          creditReservationId: reservation.referenceId,
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(userId, reservation.transactionId, 'upscale');
      throw error;
    }

    this.executeUpscale(
      generation,
      dto,
      preferredProvider,
      userId,
      reservation,
      projectId,
    ).catch((error) =>
      this.logger.error(`Upscale ${generation.id} failed: ${error.message}`),
    );

    return generation;
  }

  private async executeUpscale(
    generation: GenerationEntity,
    dto: UpscaleImageDto,
    preferredProvider: string | undefined,
    userId: string,
    reservation: { transactionId: string; amount: number },
    projectId?: string,
  ): Promise<void> {
    try {
      const result = await this.providerRegistry.executeWithFallback(
        'upscale',
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.upscaleImage(dto.imageUrl, {
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

          generation.status = providerResult.status || 'completed';
          if (providerResult.resultUrl) generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              'upscale',
            );
          } catch (captureError: any) {
            this.logger.error(
              `Failed to capture credits for upscale ${generation.id}: ${captureError.message}`,
            );
          }
          await this.baseService.saveAsset(generation, projectId);
          return providerResult;
        },
        preferredProvider,
      );

      if (!result) {
        throw new Error('Upscale did not return a result');
      }
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      try {
        await this.baseService.releaseCredits(
          userId,
          reservation.transactionId,
          'upscale',
        );
      } catch (releaseError: any) {
        this.logger.error(
          `Failed to release credits for upscale ${generation.id}: ${releaseError.message}`,
        );
      }
    }
  }

  async processImage(dto: Record<string, any>, userId: string, type: string): Promise<GenerationEntity> {
    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getImageProcessingProvider(type).name,
    );
    const reservation = await this.baseService.reserveCredits(userId, type);

    let generation: GenerationEntity;
    try {
      generation = await this.baseService.create({
        userId,
        type,
        status: 'pending',
        prompt: dto.prompt || type,
        cost: reservation.amount,
        metadata: {
          ...dto,
          provider: preferredProvider,
          creditTransactionId: reservation.transactionId,
          creditReservationId: reservation.referenceId,
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(userId, reservation.transactionId, type);
      throw error;
    }

    this.executeImageProcessing(
      generation,
      dto,
      preferredProvider,
      type,
      userId,
      reservation,
    ).catch((error) =>
      this.logger.error(`${type} processing ${generation.id} failed: ${error.message}`),
    );

    return generation;
  }

  private async executeImageProcessing(
    generation: GenerationEntity,
    dto: Record<string, any>,
    preferredProvider: string | undefined,
    type: string,
    userId: string,
    reservation: { transactionId: string; amount: number },
  ): Promise<void> {
    try {
      const result = await this.providerRegistry.executeWithFallback(
        type as any,
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.processImage({
            type,
            imageUrl: dto.imageUrl,
            prompt: dto.prompt,
            strength: dto.strength,
            ...dto,
            ...(dto.metadata || {}),
          });

          generation.status = providerResult.status || 'completed';
          if (providerResult.resultUrl) generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              type,
            );
          } catch (captureError: any) {
            this.logger.error(
              `Failed to capture credits for ${type} processing ${generation.id}: ${captureError.message}`,
            );
          }
          await this.baseService.saveAsset(generation);
          return providerResult;
        },
        preferredProvider,
      );

      if (!result) {
        throw new Error(`${type} processing did not return a result`);
      }
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      try {
        await this.baseService.releaseCredits(
          userId,
          reservation.transactionId,
          type,
        );
      } catch (releaseError: any) {
        this.logger.error(
          `Failed to release credits for ${type} processing ${generation.id}: ${releaseError.message}`,
        );
      }
    }
  }
}
