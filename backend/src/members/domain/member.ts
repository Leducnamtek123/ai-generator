import { ApiProperty } from '@nestjs/swagger';

export enum OrgRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BILLING = 'BILLING',
}

export class Member {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  organizationId: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
