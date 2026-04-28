import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SocialPostEntity } from './social-post.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'social_post_metric',
})
export class SocialPostMetricEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  comments: number;

  @Column({ default: 0 })
  shares: number;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'jsonb', nullable: true })
  rawMetrics: any; // Raw platform-specific data

  @ManyToOne(() => SocialPostEntity, {
    onDelete: 'CASCADE',
  })
  post: SocialPostEntity;

  @CreateDateColumn()
  createdAt: Date;
}
