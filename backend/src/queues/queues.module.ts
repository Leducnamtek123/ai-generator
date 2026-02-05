import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GenerationProcessor } from './processors/generation.processor';
import redisConfig from './config/redis.config';
import { GENERATION_QUEUE, WORKFLOW_QUEUE } from './queues.constants';

@Module({
    imports: [
        ConfigModule.forFeature(redisConfig),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get('redis.host'),
                    port: configService.get('redis.port'),
                    password: configService.get('redis.password'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue(
            { name: GENERATION_QUEUE },
            { name: WORKFLOW_QUEUE },
        ),
    ],
    providers: [GenerationProcessor],
    exports: [BullModule],
})
export class QueuesModule { }
