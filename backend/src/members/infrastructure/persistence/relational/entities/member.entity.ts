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
import { EntityRelationalHelper } from '../../../../utils/relational-entity-helper';
import { OrganizationEntity } from '../../../../organizations/infrastructure/persistence/relational/entities/organization.entity';

export enum OrgRoleEnum {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BILLING = 'BILLING',
}

@Entity({ name: 'member' })
@Unique(['userId', 'organizationId'])
export class MemberEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({
    type: 'enum',
    enum: OrgRoleEnum,
    default: OrgRoleEnum.MEMBER,
  })
  role: OrgRoleEnum;

  @ManyToOne(() => OrganizationEntity, (org) => org.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
