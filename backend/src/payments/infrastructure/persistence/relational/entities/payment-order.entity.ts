import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PaymentProvider } from '../../../../config/payments-config.type';

export type PaymentOrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

@Entity({ name: 'payment_order' })
export class PaymentOrderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  provider: PaymentProvider;

  @Column({ unique: true })
  @Index()
  orderCode: string;

  @Column('int')
  credits: number;

  @Column('int')
  amountVnd: number;

  @Column({ default: 'pending' })
  @Index()
  status: PaymentOrderStatus;

  @Column({ type: 'varchar', nullable: true })
  paymentUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  providerTxnRef: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  callbackPayload: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
