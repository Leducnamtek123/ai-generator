import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminAuditService } from './admin-audit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SiteConfigModule } from '../site-config/site-config.module';
import { QueuesModule } from '../queues/queues.module';
import { AdminQueueService } from './admin-queue.service';

@Module({
  imports: [NotificationsModule, SiteConfigModule, QueuesModule],
  controllers: [AdminController],
  providers: [AdminCatalogService, AdminAuditService, AdminQueueService],
})
export class AdminModule {}
