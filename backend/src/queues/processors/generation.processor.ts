import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GENERATION_QUEUE } from '../queues.constants';

export interface GenerationJobData {
    type: 'image' | 'video' | 'upscale' | 'enhance';
    userId: string;
    params: Record<string, any>;
    callbackUrl?: string;
}

export interface GenerationJobResult {
    success: boolean;
    generationId: string;
    outputUrl?: string;
    error?: string;
}

@Processor(GENERATION_QUEUE)
export class GenerationProcessor extends WorkerHost {
    private readonly logger = new Logger(GenerationProcessor.name);

    async process(job: Job<GenerationJobData>): Promise<GenerationJobResult> {
        this.logger.log(`Processing job ${job.id} of type ${job.data.type}`);

        try {
            // Update progress
            await job.updateProgress(10);

            // Simulate AI generation (replace with actual provider calls)
            const result = await this.executeGeneration(job.data);

            await job.updateProgress(100);

            this.logger.log(`Job ${job.id} completed successfully`);
            return result;
        } catch (error: any) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`);
            throw error;
        }
    }

    private async executeGeneration(data: GenerationJobData): Promise<GenerationJobResult> {
        // TODO: Integrate with ProviderRegistry to call actual AI providers
        // For now, return a mock result

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            generationId: `gen_${Date.now()}`,
            outputUrl: `https://placeholder.com/generated/${data.type}/${Date.now()}.png`,
        };
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<GenerationJobData>) {
        this.logger.log(`Job ${job.id} completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<GenerationJobData>, error: Error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }

    @OnWorkerEvent('progress')
    onProgress(job: Job<GenerationJobData>, progress: number | object) {
        this.logger.debug(`Job ${job.id} progress: ${JSON.stringify(progress)}`);
    }
}
