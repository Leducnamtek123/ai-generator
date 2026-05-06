import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import {
  CreditTransaction,
  CreditTransactionStatus,
  CreditTransactionType,
} from '../../../../domain/credit-transaction';

@Entity({ name: 'credit_transaction' })
export class CreditTransactionEntity
  extends EntityRelationalHelper
  implements CreditTransaction
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('int')
  amount: number;

  @Column()
  type: CreditTransactionType;

  @Column({ default: 'posted' })
  status: CreditTransactionStatus;

  @Column({ nullable: true })
  referenceType?: string;

  @Column({ nullable: true })
  referenceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
