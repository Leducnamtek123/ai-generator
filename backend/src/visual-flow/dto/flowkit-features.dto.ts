import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─────────────────────────────────────────────
// Material DTOs
// ─────────────────────────────────────────────

export class RegisterMaterialDto {
  @ApiProperty({ description: 'Unique material ID (e.g. "my_custom_style")' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Display name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Full style instruction for image generation' })
  @IsString()
  styleInstruction: string;

  @ApiPropertyOptional({ description: 'Negative prompt to avoid wrong styles' })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiProperty({ description: 'Short prefix prepended to scene prompts' })
  @IsString()
  scenePrefix: string;

  @ApiPropertyOptional({ description: 'Lighting description' })
  @IsOptional()
  @IsString()
  lighting?: string;
}

// ─────────────────────────────────────────────
// Post-Processing DTOs
// ─────────────────────────────────────────────

export class TrimVideoDto {
  @ApiProperty({ description: 'URL or local path of input video' })
  @IsString()
  inputUrl: string;

  @ApiProperty({ description: 'Start time in seconds' })
  @IsNumber()
  @Min(0)
  start: number;

  @ApiProperty({ description: 'End time in seconds' })
  @IsNumber()
  @Min(0)
  end: number;
}

export class MergeVideosDto {
  @ApiProperty({ description: 'Array of video URLs/paths to concatenate', type: [String] })
  @IsArray()
  @IsString({ each: true })
  videoUrls: string[];
}

export class AddNarrationDto {
  @ApiProperty({ description: 'Video URL/path' })
  @IsString()
  videoUrl: string;

  @ApiProperty({ description: 'Narration audio URL/path' })
  @IsString()
  narrationUrl: string;

  @ApiPropertyOptional({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  narrationVolume?: number;

  @ApiPropertyOptional({ default: 0.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  sfxVolume?: number;
}

export class AddMusicDto {
  @ApiProperty({ description: 'Video URL/path' })
  @IsString()
  videoUrl: string;

  @ApiProperty({ description: 'Music audio URL/path' })
  @IsString()
  musicUrl: string;

  @ApiPropertyOptional({ default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  musicVolume?: number;
}

// ─────────────────────────────────────────────
// Video Review DTOs
// ─────────────────────────────────────────────

export class ReviewVideoDto {
  @ApiPropertyOptional({ description: 'Prompt used to generate this video' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Additional context (character names, etc.)' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ enum: ['light', 'deep'], default: 'light' })
  @IsOptional()
  @IsString()
  mode?: 'light' | 'deep';

  @ApiPropertyOptional({ enum: ['VERTICAL', 'HORIZONTAL'], description: 'Orientation to review' })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL';

  @ApiPropertyOptional({ description: 'Specific scene IDs to review (comma-separated)' })
  @IsOptional()
  @IsString()
  sceneIds?: string;
}

// ─────────────────────────────────────────────
// Music Generation DTOs
// ─────────────────────────────────────────────

export class GenerateMusicDto {
  @ApiProperty({ description: 'Lyrics with [Verse]/[Chorus] tags (custom mode) or description' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Musical style tags (e.g. "lo-fi hip hop, chill, piano")' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ description: 'Song title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  instrumental?: boolean;

  @ApiPropertyOptional({ description: 'Model: V4, V4_5, V5, V5_5' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ default: true, description: 'Custom mode (lyrics) vs description mode' })
  @IsOptional()
  @IsBoolean()
  customMode?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Poll until complete before returning' })
  @IsOptional()
  @IsBoolean()
  poll?: boolean;
}

export class GenerateLyricsDto {
  @ApiProperty({ description: 'Natural language prompt for lyrics generation' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  poll?: boolean;
}

export class ExtendMusicDto {
  @ApiProperty({ description: 'Audio ID to extend' })
  @IsString()
  audioId: string;

  @ApiPropertyOptional({ description: 'Continuation prompt' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Continue from timestamp (seconds)' })
  @IsOptional()
  @IsNumber()
  continueAt?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  poll?: boolean;
}

export class VocalRemovalDto {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsString()
  audioId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  poll?: boolean;
}

export class ConvertToWavDto {
  @ApiProperty()
  @IsString()
  taskId: string;

  @ApiProperty()
  @IsString()
  audioId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  poll?: boolean;
}

// ─────────────────────────────────────────────
// Concat / Post-pipeline DTOs
// ─────────────────────────────────────────────

export class ConcatScenesDto {
  @ApiPropertyOptional({
    enum: ['VERTICAL', 'HORIZONTAL'],
    default: 'VERTICAL',
  })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL';

  @ApiPropertyOptional({ description: 'Only include these scene IDs', type: [String] })
  @IsOptional()
  @IsArray()
  sceneIds?: string[];

  @ApiPropertyOptional({ description: 'Music file URL to overlay' })
  @IsOptional()
  @IsString()
  musicUrl?: string;

  @ApiPropertyOptional({ default: 0.3 })
  @IsOptional()
  @IsNumber()
  musicVolume?: number;
}

export class ApplyMaterialDto {
  @ApiProperty({ description: 'Material ID to apply' })
  @IsString()
  materialId: string;

  @ApiPropertyOptional({
    description: 'Scene IDs to apply material to (defaults to all)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  sceneIds?: string[];
}

// ─────────────────────────────────────────────
// Image → Video DTOs
// ─────────────────────────────────────────────

export class ImageToVideoDto {
  @ApiProperty({ description: 'Image URL or local path' })
  @IsString()
  imagePath: string;

  @ApiPropertyOptional({ default: 5, description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  duration?: number;

  @ApiPropertyOptional({ enum: ['in', 'out', 'pan_left', 'pan_right'], default: 'in' })
  @IsOptional()
  @IsString()
  zoomDirection?: 'in' | 'out' | 'pan_left' | 'pan_right';

  @ApiPropertyOptional({ default: 1080 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ default: 1920 })
  @IsOptional()
  @IsNumber()
  height?: number;
}

export class ImagesToSlideshowDto {
  @ApiProperty({ description: 'Array of image paths', type: [String] })
  @IsArray()
  @IsString({ each: true })
  imagePaths: string[];

  @ApiPropertyOptional({ default: 4, description: 'Seconds per slide' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  durationPerSlide?: number;

  @ApiPropertyOptional({ default: 1, description: 'Crossfade transition seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  transitionDuration?: number;

  @ApiPropertyOptional({ default: true, description: 'Apply Ken Burns zoom effect per slide' })
  @IsOptional()
  @IsBoolean()
  zoomEffect?: boolean;

  @ApiPropertyOptional({ default: 1080 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ default: 1920 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Background music URL to overlay' })
  @IsOptional()
  @IsString()
  musicUrl?: string;

  @ApiPropertyOptional({ default: 0.3 })
  @IsOptional()
  @IsNumber()
  musicVolume?: number;
}

export class SlideshowFromScenesDto {
  @ApiPropertyOptional({ enum: ['VERTICAL', 'HORIZONTAL'], default: 'VERTICAL' })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL';

  @ApiPropertyOptional({ description: 'Only include these scene IDs', type: [String] })
  @IsOptional()
  @IsArray()
  sceneIds?: string[];

  @ApiPropertyOptional({ default: 4, description: 'Seconds per slide' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  durationPerSlide?: number;

  @ApiPropertyOptional({ default: 1, description: 'Crossfade transition seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  transitionDuration?: number;

  @ApiPropertyOptional({ default: true, description: 'Apply Ken Burns zoom effect' })
  @IsOptional()
  @IsBoolean()
  zoomEffect?: boolean;

  @ApiPropertyOptional({ description: 'Background music URL' })
  @IsOptional()
  @IsString()
  musicUrl?: string;

  @ApiPropertyOptional({ default: 0.3 })
  @IsOptional()
  @IsNumber()
  musicVolume?: number;
}

// ─────────────────────────────────────────────
// TTS / Narration DTOs
// ─────────────────────────────────────────────

export class GenerateSpeechDto {
  @ApiProperty({ description: 'Text to convert to speech' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Voice ID (e.g. "alloy", "nova", or ElevenLabs voice ID)' })
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional({ default: 1.0, description: 'Speech speed multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;

  @ApiPropertyOptional({ description: 'TTS model to use' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class GenerateVideoNarrationDto {
  @ApiPropertyOptional({ description: 'Voice ID for narration' })
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;

  @ApiPropertyOptional({ description: 'TTS model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ default: false, description: 'Force regenerate even if audio exists' })
  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;

  @ApiPropertyOptional({
    enum: ['VERTICAL', 'HORIZONTAL'],
    default: 'VERTICAL',
    description: 'Which orientation videos to overlay narration onto',
  })
  @IsOptional()
  @IsString()
  orientation?: 'VERTICAL' | 'HORIZONTAL';

  @ApiPropertyOptional({ default: false, description: 'Also overlay narration audio onto scene videos' })
  @IsOptional()
  @IsBoolean()
  overlayOnVideos?: boolean;
}

// ─────────────────────────────────────────────
// Scene Chain DTOs
// ─────────────────────────────────────────────

export class CreateContinuationSceneDto {
  @ApiProperty({ description: 'Parent scene ID to continue from' })
  @IsString()
  parentSceneId: string;

  @ApiProperty({ description: 'Prompt for the new continuation scene' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Character names for this scene', type: [String] })
  @IsOptional()
  @IsArray()
  characterNames?: string[];

  @ApiPropertyOptional({ description: 'Video motion prompt' })
  @IsOptional()
  @IsString()
  videoPrompt?: string;

  @ApiPropertyOptional({ description: 'Override display order (auto if omitted)' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateInsertSceneDto {
  @ApiProperty({ description: 'Position to insert at (0-indexed)' })
  @IsNumber()
  @Min(0)
  atOrder: number;

  @ApiProperty({ description: 'Prompt for the inserted scene' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Character names', type: [String] })
  @IsOptional()
  @IsArray()
  characterNames?: string[];
}

export class ReorderScenesDto {
  @ApiProperty({ description: 'Ordered array of scene IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  sceneIds: string[];
}

// ─────────────────────────────────────────────
// Voice Template DTOs
// ─────────────────────────────────────────────

export class CreateVoiceTemplateDto {
  @ApiProperty({ description: 'Unique template name (alphanumeric, hyphens, underscores)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Sample text to generate the template audio' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Voice ID to use' })
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional({ description: 'TTS model to use' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;
}

export class UpdateVoiceTemplateDto {
  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Voice ID' })
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional({ description: 'TTS model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;
}

// ─────────────────────────────────────────────
// Scene Cleanup DTO
// ─────────────────────────────────────────────

export class CleanupScenesDto {
  @ApiProperty({
    enum: ['ROOT', 'CONTINUATION', 'INSERT'],
    description: 'Chain type of scenes to delete',
  })
  @IsString()
  chainType: 'ROOT' | 'CONTINUATION' | 'INSERT';
}

// ─────────────────────────────────────────────
// Reference Image Prompt DTO
// ─────────────────────────────────────────────

export class BuildReferencePromptDto {
  @ApiProperty({ description: 'Entity name (character, location, etc.)' })
  @IsString()
  entityName: string;

  @ApiPropertyOptional({ description: 'Entity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ['character', 'location', 'creature', 'visual_asset'],
    default: 'character',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Material ID for styling' })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({ description: 'Project story for context' })
  @IsOptional()
  @IsString()
  story?: string;
}
