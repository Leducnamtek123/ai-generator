import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ─────────────────────────────────────────────
// Character / Entity DTO
// ─────────────────────────────────────────────

export enum EntityType {
  CHARACTER = 'character',
  LOCATION = 'location',
  CREATURE = 'creature',
  VISUAL_ASSET = 'visual_asset',
}

export class CreateCharacterDto {
  @ApiProperty({ description: 'Unique name used in scene prompts (e.g. "Luna")' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: EntityType, default: EntityType.CHARACTER })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiPropertyOptional({ description: 'Appearance description for reference image generation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Voice description for TTS (max 30 words)' })
  @IsOptional()
  @IsString()
  voiceDescription?: string;
}

// ─────────────────────────────────────────────
// Project DTOs
// ─────────────────────────────────────────────

export class CreateVisualProjectDto {
  @ApiProperty({ description: 'Project name / series title' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Full story text used to derive scenes' })
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional({ description: 'Language code', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Characters/entities to create with the project',
    type: [CreateCharacterDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCharacterDto)
  characters?: CreateCharacterDto[];
}

export class UpdateVisualProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsString()
  status?: string;
}

// ─────────────────────────────────────────────
// Video DTOs
// ─────────────────────────────────────────────

export class CreateVisualVideoDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order within the project' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

// ─────────────────────────────────────────────
// Scene DTOs
// ─────────────────────────────────────────────

export enum ChainType {
  ROOT = 'ROOT',
  CONTINUATION = 'CONTINUATION',
  INSERT = 'INSERT',
}

export class CreateVisualSceneDto {
  @ApiProperty({ description: 'Video this scene belongs to' })
  @IsString()
  videoId: string;

  @ApiPropertyOptional({ description: 'Scene order in the video' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiProperty({ description: 'Still image prompt (what is in the frame)' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Motion prompt with sub-timings "0-3s: ..."' })
  @IsOptional()
  @IsString()
  videoPrompt?: string;

  @ApiPropertyOptional({
    description: 'Character names whose ref images will be injected',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characterNames?: string[];

  @ApiPropertyOptional({ enum: ChainType, default: ChainType.ROOT })
  @IsOptional()
  @IsEnum(ChainType)
  chainType?: ChainType;

  @ApiPropertyOptional({ description: 'ID of previous scene (required when chainType=CONTINUATION)' })
  @IsOptional()
  @IsString()
  parentSceneId?: string;
}

export class UpdateVisualSceneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoPrompt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  characterNames?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

// ─────────────────────────────────────────────
// Pipeline DTOs
// ─────────────────────────────────────────────

export class GenerateRefsDto {
  @ApiPropertyOptional({
    description: 'Character IDs to generate (defaults to all pending in project)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  characterIds?: string[];
}

export class GenerateSceneImagesDto {
  @ApiPropertyOptional({ enum: ['VERTICAL', 'HORIZONTAL', 'BOTH'], default: 'BOTH' })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL' | 'BOTH';

  @ApiPropertyOptional({ description: 'Specific scene IDs (defaults to all pending)' })
  @IsOptional()
  @IsArray()
  sceneIds?: string[];
}

export class GenerateSceneVideosDto {
  @ApiPropertyOptional({ enum: ['VERTICAL', 'HORIZONTAL', 'BOTH'], default: 'BOTH' })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL' | 'BOTH';

  @ApiPropertyOptional({ description: 'Specific scene IDs (defaults to all with completed images)' })
  @IsOptional()
  @IsArray()
  sceneIds?: string[];
}
