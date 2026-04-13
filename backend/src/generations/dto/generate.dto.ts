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

// ======== Audio Generation DTOs ========

export class GenerateMusicDto {
  @ApiProperty({ description: 'Text description of the music to generate' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ enum: ['pop', 'rock', 'electronic', 'classical', 'jazz', 'ambient', 'cinematic', 'lofi', 'hiphop', 'rnb', 'country', 'reggae'] })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Mood tags', type: [String] })
  @IsOptional()
  moods?: string[];

  @ApiPropertyOptional({ description: 'Instrument tags', type: [String] })
  @IsOptional()
  instruments?: string[];

  @ApiPropertyOptional({ description: 'Duration in seconds', minimum: 15, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Tempo in BPM', minimum: 60, maximum: 200 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(200)
  tempo?: number;
}

export class GenerateSfxDto {
  @ApiProperty({ description: 'Text description of the sound effect' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ enum: ['nature', 'urban', 'mechanical', 'digital', 'human', 'musical', 'weather', 'scifi'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', minimum: 0.5, maximum: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(30)
  duration?: number;
}

export class GenerateVoiceDto {
  @ApiProperty({ description: 'Text to speak or voice description' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ enum: ['tts', 'clone'] })
  @IsOptional()
  @IsString()
  mode?: 'tts' | 'clone';

  @ApiPropertyOptional({ description: 'Voice ID from library' })
  @IsOptional()
  @IsString()
  voiceId?: string;

  @ApiPropertyOptional({ description: 'Language code' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Emotion', enum: ['neutral', 'happy', 'sad', 'angry', 'excited', 'calm'] })
  @IsOptional()
  @IsString()
  emotion?: string;

  @ApiPropertyOptional({ description: 'Speech speed', minimum: 0.5, maximum: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  speed?: number;
}

// ======== Video Processing DTOs ========

export class LipSyncDto {
  @ApiProperty({ description: 'URL of the source video' })
  @IsString()
  videoUrl: string;

  @ApiProperty({ description: 'URL of the audio track' })
  @IsString()
  audioUrl: string;

  @ApiPropertyOptional({ enum: ['full', 'lips-only', 'expressive'] })
  @IsOptional()
  @IsString()
  syncMode?: string;

  @ApiPropertyOptional({ description: 'Sync accuracy', minimum: 50, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(100)
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Motion smoothing', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  smoothing?: number;
}

export class UpscaleVideoDto {
  @ApiProperty({ description: 'URL of the source video' })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ enum: ['720p', '1080p', '2k', '4k'] })
  @IsOptional()
  @IsString()
  targetResolution?: string;

  @ApiPropertyOptional({ enum: ['fast', 'balanced', 'quality'] })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Denoise level', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  denoise?: number;

  @ApiPropertyOptional({ description: 'Sharpen level', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sharpen?: number;

  @ApiPropertyOptional({ description: 'Enable FPS boosting to 60fps' })
  @IsOptional()
  fpsBoost?: boolean;
}

// ======== Image Processing DTOs ========

export class RemoveBackgroundDto {
  @ApiProperty({ description: 'URL of the image' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ enum: ['auto', 'person', 'product', 'animal'] })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: 'Edge refinement level', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  edgeRefinement?: number;
}

export class SketchToImageDto {
  @ApiProperty({ description: 'Text prompt describing the desired image' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Base64 or URL of the sketch image' })
  @IsString()
  sketchUrl: string;

  @ApiPropertyOptional({ enum: ['photorealistic', 'anime', 'oil-painting', 'watercolor', 'pencil'] })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'How closely to follow the sketch (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fidelity?: number;
}

export class ImageVariationsDto {
  @ApiProperty({ description: 'URL of the source image' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Text guidance for variations' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Variation strength (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  strength?: number;

  @ApiPropertyOptional({ description: 'Number of variations', minimum: 1, maximum: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  count?: number;
}

export class CameraChangeDto {
  @ApiProperty({ description: 'URL of the source image' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ enum: ['orbit-left', 'orbit-right', 'zoom-in', 'zoom-out', 'pan-up', 'pan-down', 'tilt'] })
  @IsOptional()
  @IsString()
  movement?: string;

  @ApiPropertyOptional({ description: 'Camera angle change degree' })
  @IsOptional()
  @IsNumber()
  angle?: number;

  @ApiPropertyOptional({ description: 'Text prompt for additional guidance' })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class IconGeneratorDto {
  @ApiProperty({ description: 'Text description of the icon' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ enum: ['flat', '3d', 'outline', 'filled', 'gradient', 'glassmorphism'] })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ enum: ['64', '128', '256', '512', '1024'] })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Primary color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Background color hex or transparent' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;
}

export class ImageExtendDto {
  @ApiProperty({ description: 'URL of the source image' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ enum: ['left', 'right', 'up', 'down', 'all'] })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional({ description: 'How many pixels to extend' })
  @IsOptional()
  @IsNumber()
  pixels?: number;

  @ApiPropertyOptional({ description: 'Text prompt for outpainting guidance' })
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class MockupGeneratorDto {
  @ApiProperty({ description: 'URL of the design image to place on mockup' })
  @IsString()
  designUrl: string;

  @ApiPropertyOptional({ enum: ['phone', 'laptop', 'tablet', 'tshirt', 'mug', 'poster', 'book', 'card'] })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ description: 'Text prompt for background/scene' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Mockup scene style' })
  @IsOptional()
  @IsString()
  scene?: string;
}

export class SkinEnhanceDto {
  @ApiProperty({ description: 'URL of the portrait image' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Enhancement level (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  level?: number;

  @ApiPropertyOptional({ enum: ['natural', 'smooth', 'glamour', 'studio'] })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({ description: 'Preserve freckles/moles' })
  @IsOptional()
  preserveDetails?: boolean;
}

