import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { VisualFlowController } from './visual-flow.controller';
import { VisualFlowService } from './visual-flow.service';
import { VisualProjectEntity } from './entities/visual-project.entity';
import { VisualCharacterEntity } from './entities/visual-character.entity';
import { VisualVideoEntity } from './entities/visual-video.entity';
import { VisualSceneEntity } from './entities/visual-scene.entity';
import { VoiceTemplateEntity } from './entities/voice-template.entity';
import { GenerationsModule } from '../generations/generations.module';
import { BullModule } from '@nestjs/bullmq';
import { VISUAL_FLOW_QUEUE } from '../queues/queues.constants';

// FlowKit ported services
import { MaterialsService } from './services/materials.service';
import { PostProcessService } from './services/post-process.service';
import { VideoReviewService } from './services/video-review.service';
import { MusicService } from './services/music.service';
import { TTSService } from './services/tts.service';
import { SceneChainService } from './services/scene-chain.service';
import { CascadeService } from './services/cascade.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { VisualFlowEventsService } from './services/visual-flow-events.service';
import { VisualFlowSseController } from './visual-flow-sse.controller';
import { VisualFlowProcessor } from './visual-flow.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VisualProjectEntity,
      VisualCharacterEntity,
      VisualVideoEntity,
      VisualSceneEntity,
      VoiceTemplateEntity,
    ]),
    BullModule.registerQueue({ name: VISUAL_FLOW_QUEUE }),
    GenerationsModule,
    ConfigModule,
  ],
  controllers: [VisualFlowController, VisualFlowSseController],
  providers: [
    VisualFlowService,
    MaterialsService,
    PostProcessService,
    VideoReviewService,
    MusicService,
    TTSService,
    SceneChainService,
    CascadeService,
    PromptBuilderService,
    VisualFlowEventsService,
    VisualFlowProcessor,
  ],
  exports: [
    VisualFlowService,
    MaterialsService,
    PostProcessService,
    VideoReviewService,
    MusicService,
    TTSService,
    SceneChainService,
    CascadeService,
    PromptBuilderService,
    VisualFlowEventsService,
  ],
})
export class VisualFlowModule {}
