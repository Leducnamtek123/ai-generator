import { ApiProperty } from '@nestjs/swagger';

export class CreditTransaction {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  type: 'generation' | 'topup' | 'refund';

  @ApiProperty({ type: Object, nullable: true })
  metadata?: any;

  @ApiProperty()
  createdAt: Date;
}
