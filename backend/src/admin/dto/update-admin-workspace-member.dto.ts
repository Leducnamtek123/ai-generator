import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRoleEnum } from '../../members/infrastructure/persistence/relational/entities/member.entity';

export class UpdateAdminWorkspaceMemberDto {
  @ApiPropertyOptional({ enum: WorkspaceRoleEnum })
  @IsOptional()
  @IsEnum(WorkspaceRoleEnum)
  role?: WorkspaceRoleEnum;
}
