import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccountEntity } from './infrastructure/persistence/relational/entities/social-account.entity';
import { SocialPostEntity } from './infrastructure/persistence/relational/entities/social-post.entity';
import { SocialPostMetricEntity } from './infrastructure/persistence/relational/entities/social-post-metric.entity';

import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
// Token refresh uses BullMQ repeatable jobs instead of @nestjs/schedule
import { SOCIAL_POSTING_QUEUE, SOCIAL_ANALYTICS_QUEUE } from '../queues/queues.constants';
import { SocialPostingProcessor } from './queues/social-posting.processor';
import { SocialAnalyticsProcessor } from './queues/social-analytics.processor';
import { SocialAnalyticsService } from './services/social-analytics.service';
import { SocialAuthService } from './services/auth.service';
import { TokenRefreshService } from './services/token-refresh.service';
import { SocialAuthController } from './controllers/auth.controller';
import { SocialProviderRegistry } from './providers/social-provider.registry';
import { FacebookAdapter } from './providers/adapters/facebook.adapter';
import { XAdapter } from './providers/adapters/x.adapter';
import { LinkedinAdapter } from './providers/adapters/linkedin.adapter';
import { SocialHubController } from './social-hub.controller';
import { ChannelsService } from './services/channels.service';
import { PublishingService } from './services/publishing.service';
import { SocialHubGateway } from './gateways/social-hub.gateway';
import { AllConfigType } from '../config/config.type';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialAccountEntity,
      SocialPostEntity,
      SocialPostMetricEntity,
    ]),
    BullModule.registerQueue({
      name: SOCIAL_POSTING_QUEUE,
    }),
    BullModule.registerQueue({
      name: SOCIAL_ANALYTICS_QUEUE,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secret: configService.getOrThrow<string>('auth.secret', { infer: true }),
        signOptions: {
          expiresIn: configService.getOrThrow<any>('auth.expires', { infer: true }),
        },
      }),
    }),
    HttpModule,
    ConfigModule,
  ],
  controllers: [SocialHubController, SocialAuthController],
  providers: [
    // Services
    ChannelsService,
    PublishingService,
    SocialAuthService,
    SocialAnalyticsService,
    TokenRefreshService,
    
    // Queue Processors
    SocialPostingProcessor,
    SocialAnalyticsProcessor,
    
    // Provider Registry
    SocialProviderRegistry,
    
    // Adapters (3 platforms)
    FacebookAdapter,
    XAdapter,
    LinkedinAdapter,
    
    // WebSocket Gateway
    SocialHubGateway,
  ],
  exports: [
    ChannelsService,
    PublishingService,
    SocialProviderRegistry,
    SocialAnalyticsService,
    TokenRefreshService,
    SocialHubGateway,
  ],
})
export class SocialHubModule { }
