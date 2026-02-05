import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

import { TemplateTypeEnum } from '../../../../types/template-type.enum';

@Entity({ name: 'template' })
export class TemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  thumbnail: string;

  // 'workflow', 'prompt', 'style'
  @Column({
    type: 'enum',
    enum: TemplateTypeEnum,
    default: TemplateTypeEnum.WORKFLOW_EDITOR,
  })
  type: TemplateTypeEnum;

  // 'public', 'private', 'community'
  @Column({ default: 'private' })
  visibility: string;

  @Column({ type: 'jsonb', nullable: true })
  content: any; // The node graph or prompt data

  @ManyToOne(() => UserEntity, { eager: true })
  author: UserEntity;

  @Column({ nullable: true })
  authorId: string;

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
