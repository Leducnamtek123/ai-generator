import { ApiProperty } from '@nestjs/swagger';

export class Organization {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  url?: string | null;

  @ApiProperty({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: String, nullable: true })
  domain?: string | null;

  @ApiProperty({ type: Boolean })
  shouldAttachUsersByDomain: boolean;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ type: Number })
  ownerId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
