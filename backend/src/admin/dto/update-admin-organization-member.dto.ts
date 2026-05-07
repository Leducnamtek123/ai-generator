import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrgRoleEnum } from '../../members/infrastructure/persistence/relational/entities/member.entity';

export class UpdateAdminOrganizationMemberDto {
  @ApiPropertyOptional({ enum: OrgRoleEnum })
  @IsOptional()
  @IsEnum(OrgRoleEnum)
  role?: OrgRoleEnum;
}
