import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigController } from './site-config.controller';
import { SiteConfigEntity } from './entities/site-config.entity';
import { SiteConfigService } from './site-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfigEntity])],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
  exports: [SiteConfigService],
})
export class SiteConfigModule {}
