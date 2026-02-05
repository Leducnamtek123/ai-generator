import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerationProcessor } from './processors/generation.processor';
import redisConfig from './config/redis.config';
import { GENERATION_QUEUE, WORKFLOW_QUEUE } from './queues.constants';
import { ProvidersModule } from '../providers/providers.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { GenerationsModule } from '../generations/generations.module';
import { AllConfigType } from '../config/config.type';
import { forwardRef } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';

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
      { name: GENERATION_QUEUE },
      { name: WORKFLOW_QUEUE },
    ),
    ProvidersModule,
    GenerationsModule,
    forwardRef(() => WorkflowsModule),
    CreditsModule,
  ],
  providers: [GenerationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
