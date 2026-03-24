import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { Project } from '../../../../domain/project';
import { OrganizationEntity } from '../../../../../organizations/infrastructure/persistence/relational/entities/organization.entity';

@Entity({ name: 'project' })
export class ProjectEntity extends EntityRelationalHelper implements Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ type: 'jsonb', nullable: true })
  content: any;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({ name: 'owner_member_id', nullable: true })
  ownerMemberId: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
