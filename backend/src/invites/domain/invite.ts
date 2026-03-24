import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../members/domain/member';

export class Invite {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number, nullable: true })
  authorId?: number | null;

  @ApiProperty({ type: String })
  organizationId: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  createdAt: Date;
}
