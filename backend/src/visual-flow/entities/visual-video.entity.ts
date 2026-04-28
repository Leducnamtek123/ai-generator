import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { VisualProjectEntity } from './visual-project.entity';
import { VisualSceneEntity } from './visual-scene.entity';

@Entity({ name: 'visual_video' })
export class VisualVideoEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  projectId: string;

  @ManyToOne(() => VisualProjectEntity, (p) => p.videos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: VisualProjectEntity;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: 'DRAFT' })
  status: string; // 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

  /** Final concatenated video URLs */
  @Column({ nullable: true })
  verticalUrl: string;

  @Column({ nullable: true })
  horizontalUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @OneToMany(() => VisualSceneEntity, (s) => s.video, { cascade: true })
  scenes: VisualSceneEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
