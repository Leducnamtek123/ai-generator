import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { WorkspaceRoleEnum } from '../../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Entity({ name: 'invite' })
@Unique(['workspaceId', 'email'])
export class InviteEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: number;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  @Index()
  email: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRoleEnum,
    default: WorkspaceRoleEnum.MEMBER,
  })
  role: WorkspaceRoleEnum;

  @ManyToOne(() => WorkspaceEntity, 'invites', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
