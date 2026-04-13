import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationsService } from './generations.service';
import { GenerationsController } from './generations.controller';
import { GenerationEntity } from './entities/generation.entity';
import { ProvidersModule } from '../providers/providers.module';
import { CreditsModule } from '../credits/credits.module';
import { AssetsModule } from '../assets/assets.module';
import { GenerationBaseService } from './services/generation-base.service';
import { ImageGenerationService } from './services/image-generation.service';
import { VideoGenerationService } from './services/video-generation.service';
import { AudioGenerationService } from './services/audio-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationEntity]),
    ProvidersModule,
    CreditsModule,
    AssetsModule,
  ],
  controllers: [GenerationsController],
  providers: [
    GenerationsService,
    GenerationBaseService,
    ImageGenerationService,
    VideoGenerationService,
    AudioGenerationService,
  ],
  exports: [GenerationsService],
})
export class GenerationsModule {}
