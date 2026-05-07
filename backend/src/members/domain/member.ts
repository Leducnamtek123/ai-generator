import { ApiProperty } from '@nestjs/swagger';

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BILLING = 'BILLING',
  VIEWER = 'VIEWER',
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
