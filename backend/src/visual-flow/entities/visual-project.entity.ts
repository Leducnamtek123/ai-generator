import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';
import { VisualCharacterEntity } from './visual-character.entity';
import { VisualVideoEntity } from './visual-video.entity';

@Entity({ name: 'visual_project' })
export class VisualProjectEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: 'ACTIVE' })
  status: string; // 'ACTIVE', 'ARCHIVED'

  @OneToMany(() => VisualCharacterEntity, (c) => c.project, { cascade: true })
  characters: VisualCharacterEntity[];

  @OneToMany(() => VisualVideoEntity, (v) => v.project, { cascade: true })
  videos: VisualVideoEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
