import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { OrgRole } from '../domain/member';

export class UpdateMemberDto {
  @ApiProperty({ enum: OrgRole })
  @IsNotEmpty()
  @IsEnum(OrgRole)
  role: OrgRole;
}

export class CreateInviteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.MEMBER })
  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}
