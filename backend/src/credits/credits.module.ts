import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { BillingAccountsModule } from '../billing-accounts/billing-accounts.module';

@Module({
  imports: [RelationalPersistenceModule, BillingAccountsModule],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService, RelationalPersistenceModule],
})
export class CreditsModule {}
