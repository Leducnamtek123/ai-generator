import { ApiProperty } from '@nestjs/swagger';

export class Project {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
  })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    type: String,
  })
  userId: string;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  thumbnail?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
