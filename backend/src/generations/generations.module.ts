import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationsService } from './generations.service';
import { GenerationsController } from './generations.controller';
import { GenerationEntity } from './entities/generation.entity';
import { ProvidersModule } from '../providers/providers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GenerationEntity]),
        ProvidersModule
    ],
    controllers: [GenerationsController],
    providers: [GenerationsService],
})
export class GenerationsModule { }
