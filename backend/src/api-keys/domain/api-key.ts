import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class ApiKey {
  @ApiProperty({
    type: String,
    example: 'uuid-v4',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'e3b0c44298fc1c14...',
  })
  key: string;

  @ApiProperty({
    type: String,
    example: 'ak_1a2b3c4d5e',
  })
  keyPrefix: string;

  @ApiProperty({
    type: String,
    example: '9f0a',
  })
  keyLast4: string;

  @ApiProperty({
    type: String,
    example: 'Claude Desktop',
  })
  name: string | null;

  @ApiProperty({
    type: () => User,
  })
  user: User;

  @ApiProperty()
  lastUsedAt: Date | null;

  @ApiProperty()
  expiresAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
