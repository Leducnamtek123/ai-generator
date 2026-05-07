import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { QueryAdminCommonDto } from './query-admin-common.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

export class QueryAdminUsersDto extends QueryAdminCommonDto {
  @ApiPropertyOptional({ enum: [RoleEnum.admin, RoleEnum.user] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: RoleEnum;

  @ApiPropertyOptional({ enum: [StatusEnum.active, StatusEnum.inactive] })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: StatusEnum;
}
