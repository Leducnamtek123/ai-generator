import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from './infrastructure/persistence/relational/entities/notification.entity';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async create(data: {
    userId: number;
    title: string;
    message: string;
    type?: NotificationType;
  }) {
    return this.notificationRepository.save(
      this.notificationRepository.create(data),
    );
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
    return this.notificationRepository.update({ userId, isRead: false }, { isRead: true });
  }

  async countUnread(userId: number) {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
