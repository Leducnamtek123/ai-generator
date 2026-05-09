import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Index(['workflowId', 'runId'], { unique: true })
@Entity({ name: 'workflow_execution' })
export class WorkflowExecutionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workflowId: string;

  @Column({ type: 'text' })
  runId: string;

  @Column({ type: 'text', nullable: true })
  jobId?: string | null;

  @Column({ type: 'text' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  projectId?: string | null;

  @Column({ type: 'jsonb', default: {} })
  graph: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  nodeStates: Record<string, unknown>[];

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
