import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({ description: 'Text prompt for image generation' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({
    enum: ['seedream', 'flux', 'imagen3', 'midjourney', 'dalle3', 'stable'],
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: ['1:1', '4:3', '16:9', '9:16'] })
  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @ApiPropertyOptional({ enum: ['standard', 'hd', '4k'] })
  @IsOptional()
  @IsString()
  quality?: 'standard' | 'hd' | '4k';

  @ApiPropertyOptional({ description: 'What to avoid in generation' })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({ description: 'Seed for reproducible results' })
  @IsOptional()
  @IsNumber()
  seed?: number;
}

export class GenerateVideoDto {
  @ApiProperty({ description: 'Text prompt for video generation' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ enum: ['runway', 'sora', 'pika', 'kling'] })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: ['4s', '8s', '16s', '24s'] })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ enum: ['16:9', '9:16', '1:1'] })
  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @ApiPropertyOptional({ description: 'Start frame image URL' })
  @IsOptional()
  @IsString()
  startImageUrl?: string;

  @ApiPropertyOptional({ description: 'End frame image URL' })
  @IsOptional()
  @IsString()
  endImageUrl?: string;
}

import {
  UpscaleMode,
  UpscaleModel,
  UpscaleScale,
  UpscaleOptimization,
  UpscaleEngine,
} from '../generations.constants';

export class UpscaleImageDto {
  @ApiProperty({ description: 'URL of the image to upscale' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ enum: UpscaleMode, default: UpscaleMode.CREATIVE })
  @IsOptional()
  @IsString()
  mode?: UpscaleMode;

  @ApiPropertyOptional({ enum: UpscaleModel, default: UpscaleModel.MAGNIFIC })
  @IsOptional()
  @IsString()
  model?: UpscaleModel;

  @ApiPropertyOptional({ enum: UpscaleScale, default: UpscaleScale.X2 })
  @IsOptional()
  @IsNumber()
  scale?: UpscaleScale;

  @ApiPropertyOptional({
    enum: UpscaleOptimization,
    default: UpscaleOptimization.STANDARD_ULTRA,
  })
  @IsOptional()
  @IsString()
  optimization?: UpscaleOptimization;

  @ApiPropertyOptional({
    description: 'Creativity level',
    minimum: -10,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  creativity?: number;

  @ApiPropertyOptional({ description: 'HDR level', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  hdr?: number;

  @ApiPropertyOptional({
    description: 'Resemblance level',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  resemblance?: number;

  @ApiPropertyOptional({
    description: 'Fractality level',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  fractality?: number;

  @ApiPropertyOptional({
    enum: UpscaleEngine,
    default: UpscaleEngine.AUTOMATIC,
  })
  @IsOptional()
  @IsString()
  engine?: UpscaleEngine;

  @ApiPropertyOptional({ description: 'Guidance prompt' })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class EnhancePromptDto {
  @ApiProperty({ description: 'Prompt to enhance' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({
    enum: ['photorealistic', 'artistic', 'anime', 'fantasy', 'sci-fi'],
  })
  @IsOptional()
  @IsString()
  style?: string;
}

export class GenerationCallbackDto {
  @ApiProperty({ description: 'Generation ID' })
  @IsString()
  id: string;

  @ApiProperty({ enum: ['completed', 'failed'] })
  @IsString()
  status: 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Result URL if successful' })
  @IsOptional()
  @IsString()
  resultUrl?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  @IsOptional()
  @IsString()
  error?: string;
}
