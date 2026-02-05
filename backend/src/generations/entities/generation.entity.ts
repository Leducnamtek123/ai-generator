import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';

@Entity({ name: 'generation' })
export class GenerationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  type: string; // 'image', 'video', 'upscale'

  @Index()
  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ type: 'text' })
  prompt: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true, type: 'text' })
  resultUrl: string;

  @Column({ nullable: true, type: 'text' })
  thumbnailUrl: string;

  @Column({ nullable: true, type: 'text' })
  error: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
