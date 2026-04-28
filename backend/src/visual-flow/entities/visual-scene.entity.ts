import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { VisualVideoEntity } from './visual-video.entity';

@Entity({ name: 'visual_scene' })
export class VisualSceneEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  videoId: string;

  @ManyToOne(() => VisualVideoEntity, (v) => v.scenes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video: VisualVideoEntity;

  @Column({ default: 0 })
  displayOrder: number;

  /** Still image prompt — describes frame 0 */
  @Column({ type: 'text', nullable: true })
  prompt: string;

  /** Motion prompt — describes 8s clip sub-timings: "0-3s: ..., 3-6s: ..." */
  @Column({ type: 'text', nullable: true })
  videoPrompt: string;

  /**
   * JSON array of character names whose reference images are passed as inputs.
   * e.g. ["Luna", "Rocket", "Candy Planet"]
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  characterNames: string[];

  // ──────────── Chain ────────────
  @Column({ nullable: true })
  parentSceneId: string;

  /** ROOT | CONTINUATION | INSERT */
  @Column({ default: 'ROOT' })
  chainType: string;

  // ──────────── Vertical ────────────
  @Column({ nullable: true })
  verticalImageUrl: string;

  @Column({ nullable: true })
  verticalVideoUrl: string;

  @Column({ nullable: true })
  verticalMediaId: string;

  @Column({ default: 'PENDING' })
  verticalImageStatus: string;

  @Column({ default: 'PENDING' })
  verticalVideoStatus: string;

  // ──────────── Horizontal ────────────
  @Column({ nullable: true })
  horizontalImageUrl: string;

  @Column({ nullable: true })
  horizontalVideoUrl: string;

  @Column({ nullable: true })
  horizontalMediaId: string;

  @Column({ default: 'PENDING' })
  horizontalImageStatus: string;

  @Column({ default: 'PENDING' })
  horizontalVideoStatus: string;

  // ──────────── Trim ────────────
  @Column({ type: 'float', nullable: true })
  trimStart: number;

  @Column({ type: 'float', nullable: true })
  trimEnd: number;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
