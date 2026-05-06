import { Injectable, Logger } from '@nestjs/common';
import { GenerationBaseService } from './generation-base.service';
import { ProviderRegistry } from '../../providers/provider.registry';
import { GenerationEntity } from '../entities/generation.entity';

@Injectable()
export class AudioGenerationService {
  private readonly logger = new Logger(AudioGenerationService.name);

  constructor(
    private readonly baseService: GenerationBaseService,
    private readonly providerRegistry: ProviderRegistry,
  ) {}

  private getPreferredProvider(provider?: string, fallback?: string) {
    return provider?.trim() || fallback || undefined;
  }

  async generateAudio(
    dto: Record<string, any>,
    userId: string,
    type: 'music' | 'sfx' | 'voice',
  ): Promise<GenerationEntity> {
    const defaultProvider = this.providerRegistry.getAudioProvider(type);
    const preferredProvider = this.getPreferredProvider(dto.provider, defaultProvider.name);
    const reservation = await this.baseService.reserveCredits(userId, type);

    let generation: GenerationEntity;
    try {
      generation = await this.baseService.create({
        userId,
        type,
        status: 'pending',
        prompt: dto.prompt || dto.text || type,
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

    this.executeAudioGeneration(
      generation,
      dto,
      preferredProvider,
      type,
      userId,
      reservation,
    )
      .catch((error) => this.logger.error(`${type} generation ${generation.id} failed: ${error.message}`));

    return generation;
  }

  private async executeAudioGeneration(
    generation: GenerationEntity,
    dto: Record<string, any>,
    preferredProvider: string | undefined,
    type: 'music' | 'sfx' | 'voice',
    userId: string,
    reservation: { transactionId: string; amount: number },
  ): Promise<void> {
    try {
      const capability =
        type === 'music' ? 'audio-music' : type === 'sfx' ? 'audio-sfx' : 'audio-voice';

      const result = await this.providerRegistry.executeWithFallback(
        capability,
        async (provider) => {
          generation.status = 'processing';
          await this.baseService.save(generation);

          const providerResult = await provider.generateAudio(
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
              `Failed to capture credits for ${type} generation ${generation.id}: ${captureError.message}`,
            );
          }
          await this.baseService.saveAsset(generation);
          return providerResult;
        },
        preferredProvider,
      );

      if (!result) {
        throw new Error(`${type} generation did not return a result`);
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
          `Failed to release credits for ${type} generation ${generation.id}: ${releaseError.message}`,
        );
      }
    }
  }
}
