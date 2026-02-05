import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderRegistry } from '../providers/provider.registry';
import { GenerationEntity } from './entities/generation.entity';
import {
    GenerateImageDto,
    GenerateVideoDto,
    UpscaleImageDto,
    EnhancePromptDto,
} from './dto/generate.dto';
import { GenerationResult } from '../providers/provider.interface';

@Injectable()
export class GenerationsService {
    private readonly logger = new Logger(GenerationsService.name);

    constructor(
        private readonly providerRegistry: ProviderRegistry,
        @InjectRepository(GenerationEntity)
        private readonly generationsRepository: Repository<GenerationEntity>,
    ) { }

    async findOne(id: string): Promise<GenerationEntity> {
        const generation = await this.generationsRepository.findOne({ where: { id } });
        if (!generation) {
            throw new NotFoundException(`Generation with ID ${id} not found`);
        }
        return generation;
    }

    async generateImage(dto: GenerateImageDto, userId: string): Promise<GenerationEntity> {
        const provider = this.providerRegistry.getImageProvider();
        this.logger.log(`Image generation requested by user ${userId} via ${provider.name}`);

        // 1. Create PENDING entity
        const generation = this.generationsRepository.create({
            userId,
            type: 'image',
            status: 'pending',
            prompt: dto.prompt,
            model: dto.model,
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
            if (result.metadata) generation.metadata = { ...generation.metadata, ...result.metadata };

            // If the provider returned an ID (Async), we might want to store it in metadata if our ID is different
            // But usually we just track our ID.

            await this.generationsRepository.save(generation);
            return generation;

        } catch (error) {
            this.logger.error(`Generation failed: ${error.message}`);
            generation.status = 'failed';
            generation.error = error.message;
            await this.generationsRepository.save(generation);
            throw error;
        }
    }

    async generateVideo(dto: GenerateVideoDto, userId: string): Promise<GenerationEntity> {
        const provider = this.providerRegistry.getVideoProvider();
        this.logger.log(`Video generation requested by user ${userId} via ${provider.name}`);

        const generation = this.generationsRepository.create({
            userId,
            type: 'video',
            status: 'pending',
            prompt: dto.prompt,
            model: dto.model,
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
            if (result.metadata) generation.metadata = { ...generation.metadata, ...result.metadata };

            await this.generationsRepository.save(generation);
            return generation;
        } catch (error) {
            generation.status = 'failed';
            generation.error = error.message;
            await this.generationsRepository.save(generation);
            throw error;
        }
    }

    async upscaleImage(dto: UpscaleImageDto, userId: string): Promise<GenerationEntity> {
        const provider = this.providerRegistry.getUpscaleProvider();
        this.logger.log(`Upscale requested by user ${userId} via ${provider.name}`);

        const generation = this.generationsRepository.create({
            userId,
            type: 'upscale',
            status: 'pending',
            prompt: 'Upscale',
            metadata: {
                provider: provider.name,
                sourceUrl: dto.imageUrl,
                scale: dto.scale,
                enhanceMode: dto.enhanceMode,
            },
        });
        await this.generationsRepository.save(generation);

        try {
            const result = await provider.upscaleImage(dto.imageUrl, {
                scale: dto.scale || 2,
                enhanceMode: dto.enhanceMode,
            });

            generation.status = result.status;
            if (result.resultUrl) generation.resultUrl = result.resultUrl;

            await this.generationsRepository.save(generation);
            return generation;
        } catch (error) {
            generation.status = 'failed';
            generation.error = error.message;
            await this.generationsRepository.save(generation);
            throw error;
        }
    }

    async enhancePrompt(dto: EnhancePromptDto, userId: string): Promise<string> {
        const provider = this.providerRegistry.getPromptEnhancerProvider();
        return provider.enhancePrompt(dto.prompt, dto.style);
    }

    async handleCallback(id: string, status: string, resultUrl?: string, error?: string): Promise<void> {
        this.logger.log(`Callback received for generation ${id}: ${status}`);

        const generation = await this.generationsRepository.findOne({ where: { id } });
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
