import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferAdminWorkspaceDto {
  @ApiProperty()
  @IsString()
  memberId: string;
}
