import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCommunityListingDto {
  @ApiProperty({ description: 'Listing title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Short listing description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Thumbnail or cover image URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ description: 'Template type slug' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Marketplace content payload' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiProperty({
    description: 'Price in credits',
    minimum: 1,
    example: 25,
  })
  @IsNumber()
  @Min(1)
  priceCredits: number;

  @ApiPropertyOptional({
    description: 'Fee in basis points charged by the platform',
    minimum: 0,
    example: 1500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeeBps?: number;

  @ApiPropertyOptional({ description: 'Tags used for discovery' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Optional source template to clone from' })
  @IsOptional()
  @IsString()
  sourceTemplateId?: string;

  @ApiPropertyOptional({ description: 'Whether the listing is immediately visible' })
  @IsOptional()
  @IsBoolean()
  listed?: boolean;
}
