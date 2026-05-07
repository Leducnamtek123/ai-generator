import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '../mailer/mailer.service';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEnum } from '../roles/roles.enum';
import { IPaginationOptions } from '../utils/types/pagination-options';
import {
  NotificationEntity,
  NotificationType,
} from './infrastructure/persistence/relational/entities/notification.entity';
import { NotificationPreferenceEntity } from './infrastructure/persistence/relational/entities/notification-preference.entity';
import {
  NOTIFICATION_CATEGORIES,
  NotificationCategory,
  type NotificationPreferenceSnapshot,
} from './notifications.types';

export type NotificationDispatchInput = {
  userId: number | string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  emailSubject?: string;
};

type NotificationPreferenceUpdateInput = {
  category: NotificationCategory;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  adminAlertsEnabled: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private readonly notificationPreferenceRepository: Repository<NotificationPreferenceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailerService: MailerService,
  ) {}

  async create(data: {
    userId: number | string;
    title: string;
    message: string;
    type?: NotificationType;
    category?: NotificationCategory;
  }) {
    return this.notificationRepository.save(
      this.notificationRepository.create({
        ...data,
        userId: Number(data.userId),
        category: data.category ?? NotificationCategory.SYSTEM,
      }),
    );
  }

  async notifyUser(data: NotificationDispatchInput) {
    const userId = Number(data.userId);
    const preference = await this.getPreferenceSnapshot(
      userId,
      data.category ?? NotificationCategory.SYSTEM,
    );

    const inAppNotification = preference.inAppEnabled
      ? await this.create({
          userId,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
        })
      : null;

    if (preference.emailEnabled) {
      await this.sendEmailNotification({
        userId,
        subject: data.emailSubject ?? data.title,
        title: data.title,
        message: data.message,
      });
    }

    return inAppNotification;
  }

  async notifyUsers(
    userIds: Array<number | string>,
    data: Omit<NotificationDispatchInput, 'userId'>,
  ) {
    const results: Array<NotificationEntity | null> = [];
    for (const userId of userIds) {
      results.push(await this.notifyUser({ userId, ...data }));
    }
    return results;
  }

  async notifyAdminUsers(data: Omit<NotificationDispatchInput, 'userId'>) {
    const adminUsers = await this.userRepository.find({
      where: { role: { id: RoleEnum.admin } },
      relations: ['role'],
    });

    const results: Array<NotificationEntity | null> = [];
    for (const user of adminUsers) {
      const preference = await this.getPreferenceSnapshot(
        user.id,
        data.category ?? NotificationCategory.SYSTEM,
      );

      if (!preference.adminAlertsEnabled) {
        continue;
      }

      results.push(await this.notifyUser({ userId: user.id, ...data }));
    }

    return results;
  }

  async findAllByUserId(userId: number, paginationOptions: IPaginationOptions) {
    return this.notificationRepository.find({
      where: { userId },
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: number) {
    return this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async countUnread(userId: number) {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async getPreferences(userId: number) {
    const preferences = await this.notificationPreferenceRepository.find({
      where: { userId },
      order: { category: 'ASC' },
    });

    const byCategory = new Map(
      preferences.map((preference) => [preference.category, preference]),
    );

    return NOTIFICATION_CATEGORIES.map((category) => {
      const preference = byCategory.get(category);
      return {
        category,
        emailEnabled: preference?.emailEnabled ?? true,
        inAppEnabled: preference?.inAppEnabled ?? true,
        adminAlertsEnabled:
          preference?.adminAlertsEnabled ??
          (category === NotificationCategory.MODERATION),
      } satisfies NotificationPreferenceSnapshot;
    });
  }

  async updatePreferences(
    userId: number,
    preferences: NotificationPreferenceUpdateInput[],
  ) {
    for (const preference of preferences) {
      const existing = await this.notificationPreferenceRepository.findOne({
        where: { userId, category: preference.category },
      });

      if (existing) {
        existing.emailEnabled = preference.emailEnabled;
        existing.inAppEnabled = preference.inAppEnabled;
        existing.adminAlertsEnabled = preference.adminAlertsEnabled;
        await this.notificationPreferenceRepository.save(existing);
        continue;
      }

      await this.notificationPreferenceRepository.save(
        this.notificationPreferenceRepository.create({
          userId,
          ...preference,
        }),
      );
    }

    return this.getPreferences(userId);
  }

  private async getPreferenceSnapshot(
    userId: number,
    category: NotificationCategory,
  ): Promise<NotificationPreferenceSnapshot> {
    const preference = await this.notificationPreferenceRepository.findOne({
      where: { userId, category },
    });

    return {
      category,
      emailEnabled: preference?.emailEnabled ?? true,
      inAppEnabled: preference?.inAppEnabled ?? true,
      adminAlertsEnabled:
        preference?.adminAlertsEnabled ??
        (category === NotificationCategory.MODERATION),
    };
  }

  private async sendEmailNotification({
    userId,
    subject,
    title,
    message,
  }: {
    userId: number;
    subject: string;
    title: string;
    message: string;
  }) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user?.email) {
      return;
    }

    const html = [
      '<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#fff;color:#111827">',
      `<h1 style="font-size:20px;line-height:1.4;margin:0 0 12px">${title}</h1>`,
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px">${message}</p>`,
      '<p style="font-size:12px;line-height:1.5;color:#6b7280;margin:0">You can manage notification preferences in Settings.</p>',
      '</div>',
    ].join('');

    await this.mailerService.sendMail({
      to: user.email,
      subject,
      text: `${title}\n\n${message}`,
      html,
    });
  }
}
