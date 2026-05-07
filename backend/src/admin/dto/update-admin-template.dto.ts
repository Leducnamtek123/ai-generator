import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAdminTemplateDto {
  @ApiPropertyOptional({ enum: ['public', 'community', 'private'] })
  @IsOptional()
  @IsIn(['public', 'community', 'private'])
  visibility?: 'public' | 'community' | 'private';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  listed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  priceCredits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;
}
