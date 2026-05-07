import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

export type BillingAccountScopeType = 'user' | 'organization';
export type BillingAccountStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'free';
export type BillingPlanType = 'trial' | 'starter' | 'pro' | 'team' | 'enterprise';

@Entity({ name: 'billing_account' })
@Index(['scopeType', 'scopeId'], { unique: true })
export class BillingAccountEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  scopeType: BillingAccountScopeType;

  @Column({ type: 'varchar' })
  scopeId: string;

  @Column({ type: 'varchar', nullable: true })
  currentPlanId: BillingPlanType | null;

  @Column({ type: 'varchar', default: 'free' })
  status: BillingAccountStatus;

  @Column({ type: 'int', default: 0 })
  includedCreditsGranted: number;

  @Column({ type: 'int', default: 0 })
  includedCreditsRemaining: number;

  @Column({ type: 'int', default: 0 })
  topUpCreditsPurchased: number;

  @Column({ type: 'int', default: 0 })
  topUpCreditsBalance: number;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  renewalAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
