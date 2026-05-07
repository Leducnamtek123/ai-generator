import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';

@Entity({ name: 'admin_audit_log' })
export class AdminAuditLogEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  actorId: number;

  @Column({ type: 'text', nullable: true })
  actorEmail?: string | null;

  @Column({ type: 'text', nullable: true })
  actorRole?: string | null;

  @Index()
  @Column()
  action: string;

  @Index()
  @Column()
  entityType: string;

  @Column({ type: 'text', nullable: true })
  entityId?: string | null;

  @Column({ type: 'text', nullable: true })
  entityName?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
