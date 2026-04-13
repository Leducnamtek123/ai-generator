import { Injectable, Logger, NotFoundException, BadRequestException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationEntity } from '../entities/generation.entity';
import { CreditsService } from '../../credits/credits.service';
import { AssetsService } from '../../assets/assets.service';

@Injectable()
export class GenerationBaseService {
  private readonly logger = new Logger(GenerationBaseService.name);

  constructor(
    @InjectRepository(GenerationEntity)
    private readonly generationsRepository: Repository<GenerationEntity>,
    private readonly creditsService: CreditsService,
    private readonly assetsService: AssetsService,
  ) {}

  async findOne(id: string): Promise<GenerationEntity> {
    const generation = await this.generationsRepository.findOne({ where: { id } });
    if (!generation) {
      throw new NotFoundException(`Generation with ID ${id} not found`);
    }
    return generation;
  }

  async save(generation: GenerationEntity): Promise<GenerationEntity> {
    return this.generationsRepository.save(generation);
  }

  async create(data: Partial<GenerationEntity>): Promise<GenerationEntity> {
    const generation = this.generationsRepository.create(data);
    return this.generationsRepository.save(generation);
  }

  async deductCredits(userId: string, type: string) {
    const costs: Record<string, number> = {
      image: 1, video: 5, upscale: 1, music: 2, sfx: 1, voice: 1,
      'lip-sync': 3, 'video-upscale': 5, 'bg-remove': 1, 'sketch-to-image': 1,
      variations: 1, 'camera-change': 1, 'icon-gen': 1, 'image-extend': 1,
      mockup: 1, 'skin-enhance': 1,
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

  async refundCredits(userId: string, amount: number, type: string) {
    if (amount <= 0) return;
    await this.creditsService.create({
      userId,
      amount: amount,
      type: 'refund',
      metadata: { reason: 'generation_failed', generationType: type },
    });
  }

  async saveAsset(generation: GenerationEntity, projectId?: string) {
    if (!generation.resultUrl) return;

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
      this.logger.error(`Failed to save asset for generation ${generation.id}: ${err.message}`);
    }
  }

  getRepository() {
    return this.generationsRepository;
  }
}
