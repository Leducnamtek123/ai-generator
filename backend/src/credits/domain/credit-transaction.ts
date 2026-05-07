import { ApiProperty } from '@nestjs/swagger';

export type CreditTransactionStatus = 'pending' | 'posted' | 'reversed';

export type CreditTransactionType =
  | 'generation'
  | 'topup'
  | 'grant'
  | 'refund'
  | 'adjustment';

export type CreditTransactionScopeType = 'user' | 'organization';

export class CreditTransaction {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String, enum: ['user', 'organization'] })
  scopeType: CreditTransactionScopeType;

  @ApiProperty({ type: String, nullable: true })
  scopeId?: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({ type: String })
  type: CreditTransactionType;

  @ApiProperty({ type: String, enum: ['pending', 'posted', 'reversed'] })
  status: CreditTransactionStatus;

  @ApiProperty({ type: String, nullable: true })
  referenceType?: string;

  @ApiProperty({ type: String, nullable: true })
  referenceId?: string;

  @ApiProperty({ type: Object, nullable: true })
  metadata?: any;

  @ApiProperty()
  createdAt: Date;
}
