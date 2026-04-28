import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisualFlowController } from './visual-flow.controller';
import { VisualFlowService } from './visual-flow.service';
import { VisualProjectEntity } from './entities/visual-project.entity';
import { VisualCharacterEntity } from './entities/visual-character.entity';
import { VisualVideoEntity } from './entities/visual-video.entity';
import { VisualSceneEntity } from './entities/visual-scene.entity';
import { GenerationsModule } from '../generations/generations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VisualProjectEntity,
      VisualCharacterEntity,
      VisualVideoEntity,
      VisualSceneEntity,
    ]),
    GenerationsModule,
  ],
  controllers: [VisualFlowController],
  providers: [VisualFlowService],
  exports: [VisualFlowService],
})
export class VisualFlowModule {}
