import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { WorkspaceRole } from '../domain/member';

export class UpdateMemberDto {
  @ApiProperty({ enum: WorkspaceRole })
  @IsNotEmpty()
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class CreateInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}
