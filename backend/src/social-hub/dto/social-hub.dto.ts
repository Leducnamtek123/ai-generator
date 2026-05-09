import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectSocialChannelDto {
  @ApiProperty({
    description: 'Social provider identifier',
    example: 'facebook',
    enum: ['facebook', 'linkedin', 'x', 'twitter'],
  })
  @IsString()
  @IsIn(['facebook', 'linkedin', 'x', 'twitter'])
  platform: string;

  @ApiProperty({
    description: 'OAuth authorization code returned by the provider',
  })
  @IsString()
  code: string;
}

export class CreateSocialPostDto {
  @ApiProperty({ description: 'Post content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Scheduled publish timestamp',
    example: '2026-05-08T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Attached media URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Primary target account ID',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  socialAccountId?: number;

  @ApiPropertyOptional({
    description: 'Target account IDs for multi-account publishing',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  socialAccountIds?: number[];

  @ApiPropertyOptional({
    description: 'Save this post as a draft instead of queueing publish',
    default: false,
  })
  @IsOptional()
  saveDraft?: boolean;
}

export class UpdateSocialPostDto {
  @ApiPropertyOptional({ description: 'Updated post content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated attached media URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

export class RescheduleSocialPostDto {
  @ApiProperty({
    description: 'New scheduled publish timestamp',
    example: '2026-05-08T12:00:00.000Z',
  })
  @IsDateString()
  scheduledAt: string;
}

export class ReplyInboxInteractionDto {
  @ApiProperty({
    description: 'Owning social account ID',
    example: 123,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accountId: number;

  @ApiProperty({
    description: 'Provider interaction identifier',
  })
  @IsString()
  interactionId: string;

  @ApiProperty({
    description: 'Reply message body',
  })
  @IsString()
  message: string;
}

export class UpdateInboxInteractionTriageDto {
  @ApiPropertyOptional({
    description: 'Assignee name or queue label',
    example: 'Support',
  })
  @IsOptional()
  @IsString()
  assignedTo?: string | null;

  @ApiPropertyOptional({
    description: 'Labels applied to the interaction',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @ApiPropertyOptional({
    description: 'Whether the interaction should stay in follow-up',
  })
  @IsOptional()
  followUp?: boolean;
}

export class ConfirmFacebookPendingConnectionDto {
  @ApiProperty({
    description: 'Selected Facebook page IDs to keep connected',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  selectedPageIds: string[];
}

export class SocialAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Analytics window in days',
    example: 7,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;
}
