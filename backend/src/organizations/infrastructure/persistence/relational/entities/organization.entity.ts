import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../utils/relational-entity-helper';
import { MemberEntity } from '../../../../members/infrastructure/persistence/relational/entities/member.entity';
import { InviteEntity } from '../../../../invites/infrastructure/persistence/relational/entities/invite.entity';

@Entity({ name: 'organization' })
export class OrganizationEntity extends EntityRelationalHelper {
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

  @OneToMany(() => MemberEntity, (member) => member.organization)
  members: MemberEntity[];

  @OneToMany(() => InviteEntity, (invite) => invite.organization)
  invites: InviteEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
