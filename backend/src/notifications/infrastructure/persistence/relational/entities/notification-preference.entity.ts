import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { NotificationCategory } from '../../../../notifications.types';

@Entity({
  name: 'notification_preference',
})
@Index(['userId', 'category'], { unique: true })
export class NotificationPreferenceEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => UserEntity, {
    eager: false,
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  inAppEnabled: boolean;

  @Column({ default: false })
  adminAlertsEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

