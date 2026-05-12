import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'workspace' })
export class WorkspaceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true, nullable: true })
  domain: string;

  @Column({ name: 'should_attach_users_by_domain', default: false })
  shouldAttachUsersByDomain: boolean;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ type: 'enum', enum: ['PERSONAL', 'TEAM'], default: 'TEAM' })
  type: 'PERSONAL' | 'TEAM';

  @OneToMany('MemberEntity', (member: any) => member.workspace)
  members: any[];

  @OneToMany('InviteEntity', (invite: any) => invite.workspace)
  invites: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
