import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { UpdateAdminTemplateDto } from './update-admin-template.dto';

export class BulkUpdateAdminTemplatesDto extends PartialType(UpdateAdminTemplateDto) {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
