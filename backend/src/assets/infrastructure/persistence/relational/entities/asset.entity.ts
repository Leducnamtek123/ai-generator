import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { Asset } from '../../../../domain/asset';

@Entity({ name: 'asset' })
export class AssetEntity extends EntityRelationalHelper implements Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'image' | 'video' | 'audio';

  @Column()
  url: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  projectId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
