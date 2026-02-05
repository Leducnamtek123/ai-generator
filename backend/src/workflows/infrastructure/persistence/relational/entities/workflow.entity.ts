import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { Workflow } from '../../../../domain/workflow';
import { ProjectEntity } from '../../../../../projects/infrastructure/persistence/relational/entities/project.entity';

@Entity({ name: 'workflow' })
export class WorkflowEntity extends EntityRelationalHelper implements Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  nodes: any;

  @Column({ type: 'jsonb', default: [] })
  edges: any;

  @Column({ default: 'private' })
  visibility: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;

  @Column()
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
