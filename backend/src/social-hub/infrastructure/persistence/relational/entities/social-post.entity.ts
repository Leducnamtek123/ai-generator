import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { SocialAccountEntity } from './social-account.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

export enum SocialPostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

@Entity({
  name: 'social_post',
})
export class SocialPostEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  mediaUrls: string[];

  @Column({
    type: 'enum',
    enum: SocialPostStatus,
    default: SocialPostStatus.DRAFT,
  })
  status: SocialPostStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ nullable: true })
  externalPostId: string; // The ID from the social platform after publishing

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  user: UserEntity;

  @ManyToOne(() => SocialAccountEntity, {
    eager: true,
    nullable: true,
  })
  socialAccount: SocialAccountEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
