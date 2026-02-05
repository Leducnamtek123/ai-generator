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

export class UpscaleImageDto {
  @ApiProperty({ description: 'URL of the image to upscale' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ enum: [2, 4], default: 2 })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(4)
  scale?: 2 | 4;

  @ApiPropertyOptional({ enum: ['balanced', 'creative', 'faithful'] })
  @IsOptional()
  @IsString()
  enhanceMode?: 'balanced' | 'creative' | 'faithful';
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
