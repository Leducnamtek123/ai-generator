import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

export type FacebookPendingPage = {
  id: string;
  name: string;
  accessToken: string;
  picture?: string;
};

@Entity({
  name: 'facebook_pending_connection',
})
export class FacebookPendingConnectionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'facebook' })
  platform: string;

  @Column()
  providerUserId: string;

  @Column()
  providerName: string;

  @Column({ nullable: true })
  providerPicture: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', default: [] })
  pages: FacebookPendingPage[];

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
