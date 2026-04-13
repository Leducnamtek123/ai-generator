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

  async generateAudio(
    dto: Record<string, any>,
    userId: string,
    type: 'music' | 'sfx' | 'voice',
  ): Promise<GenerationEntity> {
    const provider = this.providerRegistry.getAudioProvider(type);
    const cost = await this.baseService.deductCredits(userId, type);

    const generation = await this.baseService.create({
      userId,
      type,
      status: 'pending',
      prompt: dto.prompt || dto.text || type,
      cost,
      metadata: { ...dto, provider: provider.name },
    });

    this.executeAudioGeneration(generation, dto, provider, type, userId, cost)
      .catch((error) => this.logger.error(`${type} generation ${generation.id} failed: ${error.message}`));

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
      await this.baseService.save(generation);

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
