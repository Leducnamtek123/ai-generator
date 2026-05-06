import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsModule } from '../credits/credits.module';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { CommunityMarketplaceController } from './community-marketplace.controller';
import { CommunityMarketplaceService } from './community-marketplace.service';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity]), CreditsModule],
  controllers: [CommunityMarketplaceController],
  providers: [CommunityMarketplaceService],
})
export class CommunityMarketplaceModule {}
