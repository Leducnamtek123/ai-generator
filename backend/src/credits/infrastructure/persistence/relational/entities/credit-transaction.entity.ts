import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CreditTransaction } from '../../../../domain/credit-transaction';

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
  type: 'generation' | 'topup' | 'refund';

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
