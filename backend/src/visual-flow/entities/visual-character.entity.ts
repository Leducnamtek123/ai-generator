import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { VisualProjectEntity } from './visual-project.entity';

@Entity({ name: 'visual_character' })
export class VisualCharacterEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  projectId: string;

  @ManyToOne(() => VisualProjectEntity, (p) => p.characters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: VisualProjectEntity;

  @Column()
  name: string;

  /**
   * entity_type: 'character' | 'location' | 'creature' | 'visual_asset'
   * Mirrors FlowKit's entity_type for reference image semantics.
   */
  @Column({ default: 'character' })
  entityType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  voiceDescription: string;

  /** URL of the generated reference image */
  @Column({ nullable: true })
  referenceImageUrl: string;

  /** UUID media_id used to pass this character as imageInput to scenes */
  @Column({ nullable: true })
  mediaId: string;

  /** Generation status for the reference image */
  @Column({ default: 'PENDING' })
  refStatus: string; // 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
