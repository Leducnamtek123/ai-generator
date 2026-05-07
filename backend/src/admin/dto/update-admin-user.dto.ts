import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ enum: [RoleEnum.admin, RoleEnum.user] })
  @IsOptional()
  @IsInt()
  @IsIn([RoleEnum.admin, RoleEnum.user])
  roleId?: RoleEnum;

  @ApiPropertyOptional({ enum: [StatusEnum.active, StatusEnum.inactive] })
  @IsOptional()
  @IsInt()
  @IsIn([StatusEnum.active, StatusEnum.inactive])
  statusId?: StatusEnum;
}
