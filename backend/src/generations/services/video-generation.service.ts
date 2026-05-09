import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GenerationBaseService } from './generation-base.service';
import { ProviderRegistry } from '../../providers/provider.registry';
import { GenerateVideoDto } from '../dto/generate.dto';
import { GenerationEntity } from '../entities/generation.entity';
import { GenerationEventsService } from './generation-events.service';

@Injectable()
export class VideoGenerationService {
  private readonly logger = new Logger(VideoGenerationService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly providerRegistry: ProviderRegistry,
    private readonly eventsService: GenerationEventsService,
  ) {}

  private getPreferredProvider(provider?: string, fallback?: string) {
    return provider?.trim() || fallback || undefined;
  }

  async generateVideo(
    dto: GenerateVideoDto,
    userId: string,
    projectId?: string,
  ): Promise<GenerationEntity> {
    const requestId = dto.metadata?.requestId as string | undefined;
    await this.baseService.assertProjectAccess(
      projectId ?? dto.metadata?.projectId,
      userId,
    );
    const existingGeneration = await this.baseService.findByRequestId(
      userId,
      'video',
      requestId,
    );
    if (existingGeneration) {
      return existingGeneration;
    }
    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getVideoProvider().name,
    );
    const reservation = await this.baseService.reserveCredits(userId, 'video');

    let generation: GenerationEntity;
    try {
      generation = await this.baseService.create({
        userId,
        type: 'video',
        status: 'pending',
        prompt: dto.prompt,
        model: dto.model,
        cost: reservation.amount,
        metadata: {
          provider: preferredProvider,
          duration: dto.duration,
          aspectRatio: dto.aspectRatio,
          startImageUrl: dto.startImageUrl,
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
        'video',
      );
      throw error;
    }

    this.executeVideoGeneration(
      generation,
      dto,
      preferredProvider,
      userId,
      reservation,
      projectId,
    ).catch((error) =>
      this.logger.error(
        `Video generation ${generation.id} failed: ${error.message}`,
      ),
    );

    return generation;
  }

  private async executeVideoGeneration(
    generation: GenerationEntity,
    dto: GenerateVideoDto,
    preferredProvider: string | undefined,
    userId: string,
    reservation: { transactionId: string; amount: number },
    projectId?: string,
  ): Promise<void> {
    try {
      const result = await this.providerRegistry.executeWithFallback(
        'video-generation',
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.generateVideo(dto.prompt, {
            model: dto.model,
            duration: dto.duration,
            aspectRatio: dto.aspectRatio,
            startImageUrl: dto.startImageUrl,
            endImageUrl: dto.endImageUrl,
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
          await this.baseService.captureCredits(
            userId,
            reservation.transactionId,
            'video',
          );
          try {
            this.eventsService.emitUpdate(generation, projectId);
          } catch (emitError: any) {
            this.logger.error(
              `Failed to emit video generation update ${generation.id}: ${emitError.message}`,
            );
          }
          return providerResult;
        },
        preferredProvider,
      );

      if (!result) {
        throw new Error('Video generation did not return a result');
      }
    } catch (error: any) {
      generation.status = 'failed';
      generation.error = error.message;
      await this.baseService.save(generation);
      try {
        await this.baseService.releaseCredits(
          userId,
          reservation.transactionId,
          'video',
        );
      } catch (releaseError: any) {
        this.logger.error(
          `Failed to release credits for video generation ${generation.id}: ${releaseError.message}`,
        );
      }
      this.eventsService.emitUpdate(generation, projectId);
    }
  }

  async processVideo(
    dto: Record<string, any>,
    userId: string,
    type: 'lip-sync' | 'video-upscale',
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
    if (
      type === 'lip-sync' &&
      this.providerRegistry.getProvidersForCapability('lip-sync').length === 0
    ) {
      throw new BadRequestException(
        'Lip-sync generation is not supported by any configured provider',
      );
    }

    const preferredProvider = this.getPreferredProvider(
      dto.provider,
      this.providerRegistry.getProvidersForCapability('video-upscale')[0]
        ?.name || 'replicate',
    );
    const provider = this.providerRegistry.getProvider(
      preferredProvider || 'replicate',
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
          provider: provider.name,
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

    this.executeVideoProcessing(
      generation,
      dto,
      provider,
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

  private async executeVideoProcessing(
    generation: GenerationEntity,
    dto: Record<string, any>,
    provider: any,
    type: string,
    userId: string,
    reservation: { transactionId: string; amount: number },
  ): Promise<void> {
    try {
      generation.status = 'processing';
      await this.baseService.save(generation);

      const result = await this.providerRegistry.executeWithFallback(
        'video-upscale',
        async (selectedProvider) =>
          selectedProvider.processImage({
            type,
            imageUrl: dto.videoUrl || dto.imageUrl,
            prompt: dto.prompt,
            ...dto,
          }),
        provider.name,
      );

      generation.status = result.status || 'completed';
      if (result.resultUrl) generation.resultUrl = result.resultUrl;
      if (result.metadata)
        generation.metadata = { ...generation.metadata, ...result.metadata };

      await this.baseService.save(generation);
      await this.baseService.saveAsset(generation);
      await this.baseService.captureCredits(
        userId,
        reservation.transactionId,
        type,
      );
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
