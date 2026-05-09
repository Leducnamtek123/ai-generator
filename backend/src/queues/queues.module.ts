import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerationProcessor } from './processors/generation.processor';
import redisConfig from './config/redis.config';
import {
  DEAD_LETTER_QUEUE,
  GENERATION_QUEUE,
  SOCIAL_ANALYTICS_QUEUE,
  SOCIAL_POSTING_QUEUE,
  VISUAL_FLOW_QUEUE,
  WORKFLOW_QUEUE,
} from './queues.constants';
import { ProvidersModule } from '../providers/providers.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { GenerationsModule } from '../generations/generations.module';
import { AllConfigType } from '../config/config.type';
import { forwardRef } from '@nestjs/common';
import { QueueReliabilityService } from './queue-reliability.service';
import { createReliableQueueRegistration } from './queue-options';

@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        connection: {
          host: configService.get('redis.host', { infer: true }),
          port: configService.get('redis.port', { infer: true }),
          password: configService.get('redis.password', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      createReliableQueueRegistration(GENERATION_QUEUE),
      createReliableQueueRegistration(WORKFLOW_QUEUE),
      createReliableQueueRegistration(SOCIAL_POSTING_QUEUE),
      createReliableQueueRegistration(SOCIAL_ANALYTICS_QUEUE),
      createReliableQueueRegistration(VISUAL_FLOW_QUEUE),
      { name: DEAD_LETTER_QUEUE },
    ),
    ProvidersModule,
    GenerationsModule,
    forwardRef(() => WorkflowsModule),
  ],
  providers: [GenerationProcessor, QueueReliabilityService],
  exports: [BullModule, QueueReliabilityService],
})
export class QueuesModule {}
