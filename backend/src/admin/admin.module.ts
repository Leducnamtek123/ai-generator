import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminAuditService } from './admin-audit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [NotificationsModule, SiteConfigModule],
  controllers: [AdminController],
  providers: [AdminCatalogService, AdminAuditService],
})
export class AdminModule {}
