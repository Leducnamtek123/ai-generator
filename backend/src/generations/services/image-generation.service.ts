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

  async generateImage(
    dto: GenerateImageDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const requestId = dto.metadata?.requestId as string | undefined;
    await this.baseService.assertProjectAccess(
      projectId ?? (dto as any).metadata?.projectId,
      userId,
    );
    const existingGeneration = await this.baseService.findByRequestId(
      userId,
      'image',
      requestId,
    );
    if (existingGeneration) {
      return existingGeneration;
    }
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
          referenceImageUrl: dto.referenceImageUrl,
          projectId,
          creditTransactionId: reservation.transactionId,
          creditReservationId: reservation.referenceId,
          requestId,
          ...(dto.metadata || {}),
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(
        userId,
        reservation.transactionId,
        'image',
      );
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
      this.logger.error(
        `Image generation ${generation.id} failed: ${error.message}`,
      ),
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
          if (providerResult.resultUrl)
            generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          await this.baseService.saveAsset(generation, projectId);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              'image',
            );
          } catch (captureError: any) {
            this.logger.warn(
              `Failed to capture credits for image generation ${generation.id}: ${captureError.message}`,
            );
            generation.metadata = {
              ...generation.metadata,
              creditCaptureError: captureError.message,
            };
            await this.baseService.save(generation);
          }
          try {
            this.eventsService.emitUpdate(generation, projectId);
          } catch (emitError: any) {
            this.logger.error(
              `Failed to emit image generation update ${generation.id}: ${emitError.message}`,
            );
          }
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

  async upscaleImage(
    dto: UpscaleImageDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const requestId = (
      dto as UpscaleImageDto & { metadata?: { requestId?: string } }
    ).metadata?.requestId;
    const metadataProjectId = (
      dto as UpscaleImageDto & { metadata?: { projectId?: string } }
    ).metadata?.projectId;
    await this.baseService.assertProjectAccess(
      projectId ?? metadataProjectId,
      userId,
    );
    const existingGeneration = await this.baseService.findByRequestId(
      userId,
      'upscale',
      requestId,
    );
    if (existingGeneration) {
      return existingGeneration;
    }
    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getUpscaleProvider().name,
    );
    const reservation = await this.baseService.reserveCredits(
      userId,
      'upscale',
    );

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
          requestId,
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(
        userId,
        reservation.transactionId,
        'upscale',
      );
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
          if (providerResult.resultUrl)
            generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          await this.baseService.saveAsset(generation, projectId);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              'upscale',
            );
          } catch (captureError: any) {
            this.logger.warn(
              `Failed to capture credits for upscale ${generation.id}: ${captureError.message}`,
            );
            generation.metadata = {
              ...generation.metadata,
              creditCaptureError: captureError.message,
            };
            await this.baseService.save(generation);
          }
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

  async processImage(
    dto: Record<string, any>,
    userId: string,
    type: string,
  ): Promise<GenerationEntity> {
    const requestId = dto.metadata?.requestId as string | undefined;
    await this.baseService.assertProjectAccess(
      dto.projectId ?? dto.metadata?.projectId,
      userId,
    );
    const existingGeneration = await this.baseService.findByRequestId(
      userId,
      type,
      requestId,
    );
    if (existingGeneration) {
      return existingGeneration;
    }
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
          requestId,
        },
      });
    } catch (error) {
      await this.baseService.releaseCredits(
        userId,
        reservation.transactionId,
        type,
      );
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
      this.logger.error(
        `${type} processing ${generation.id} failed: ${error.message}`,
      ),
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
      const imageUrl = dto.imageUrl || dto.sketchUrl;
      const result = await this.providerRegistry.executeWithFallback(
        type as any,
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.processImage({
            type,
            imageUrl,
            prompt: dto.prompt,
            strength: dto.strength,
            ...dto,
            ...(dto.metadata || {}),
          });

          generation.status = providerResult.status || 'completed';
          if (providerResult.resultUrl)
            generation.resultUrl = providerResult.resultUrl;
          generation.metadata = {
            ...generation.metadata,
            ...(providerResult.metadata || {}),
            provider: provider.name,
          };

          await this.baseService.save(generation);
          await this.baseService.saveAsset(generation);
          try {
            await this.baseService.captureCredits(
              userId,
              reservation.transactionId,
              type,
            );
          } catch (captureError: any) {
            this.logger.warn(
              `Failed to capture credits for ${type} processing ${generation.id}: ${captureError.message}`,
            );
            generation.metadata = {
              ...generation.metadata,
              creditCaptureError: captureError.message,
            };
            await this.baseService.save(generation);
          }
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
