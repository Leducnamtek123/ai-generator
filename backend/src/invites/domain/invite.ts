import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../../members/domain/member';

export class Invite {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number, nullable: true })
  authorId?: number | null;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  email: string;

  @ApiProperty({ enum: WorkspaceRole })
  role: WorkspaceRole;

  @ApiProperty()
  createdAt: Date;
}
