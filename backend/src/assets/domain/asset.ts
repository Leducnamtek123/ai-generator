import { ApiProperty } from '@nestjs/swagger';

export class Asset {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  type: 'image' | 'video' | 'audio';

  @ApiProperty({ type: String })
  url: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String, nullable: true })
  projectId?: string | null;

  @ApiProperty({ type: Object, nullable: true })
  metadata?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
