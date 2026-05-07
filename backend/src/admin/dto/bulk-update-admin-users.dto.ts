import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { UpdateAdminUserDto } from './update-admin-user.dto';

export class BulkUpdateAdminUsersDto extends PartialType(UpdateAdminUserDto) {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
