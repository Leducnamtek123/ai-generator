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
import { OrganizationEntity } from '../../../../../organizations/infrastructure/persistence/relational/entities/organization.entity';
import { OrgRoleEnum } from '../../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Entity({ name: 'invite' })
@Unique(['organizationId', 'email'])
export class InviteEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: number;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  @Index()
  email: string;

  @Column({
    type: 'enum',
    enum: OrgRoleEnum,
    default: OrgRoleEnum.MEMBER,
  })
  role: OrgRoleEnum;

  @ManyToOne(() => OrganizationEntity, 'invites', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
