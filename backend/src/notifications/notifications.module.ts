import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './infrastructure/persistence/relational/entities/notification.entity';
import { NotificationPreferenceEntity } from './infrastructure/persistence/relational/entities/notification-preference.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationPreferenceEntity,
      UserEntity,
    ]),
    MailerModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
