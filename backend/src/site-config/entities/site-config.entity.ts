import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../utils/relational-entity-helper';

@Index(['key', 'locale'], { unique: true })
@Entity({ name: 'site_config' })
export class SiteConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text' })
  locale: string;

  @Column({ type: 'jsonb', default: {} })
  value: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'integer', nullable: true })
  updatedById?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
