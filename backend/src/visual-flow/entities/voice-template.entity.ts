import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Voice template entity — stores saved voice presets for TTS narration.
 * Users can create templates from reference audio to maintain
 * consistent narration voice across scenes/projects.
 */
@Entity('voice_template')
export class VoiceTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  audioPath: string;

  @Column({ nullable: true })
  referenceText: string;

  @Column({ nullable: true })
  voice: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'double precision', nullable: true })
  speed: number;

  @Column({ type: 'double precision', nullable: true })
  duration: number;

  @Column({ default: 'openai' })
  provider: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
