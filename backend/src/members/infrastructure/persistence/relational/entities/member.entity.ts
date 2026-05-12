import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

export enum WorkspaceRoleEnum {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BILLING = 'BILLING',
}

@Entity({ name: 'member' })
@Unique(['userId', 'workspaceId'])
export class MemberEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRoleEnum,
    default: WorkspaceRoleEnum.MEMBER,
  })
  role: WorkspaceRoleEnum;

  @ManyToOne(() => WorkspaceEntity, 'members', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
