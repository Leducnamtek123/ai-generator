import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { WorkspaceRelationalPersistenceModule } from '../workspaces/infrastructure/persistence/relational/relational-persistence.module';
import { BillingAccountsModule } from '../billing-accounts/billing-accounts.module';
import { PlansController } from './plans.controller';
import { PersonalBillingController } from './personal-billing.controller';

@Module({
  imports: [
    MemberRelationalPersistenceModule,
    WorkspaceRelationalPersistenceModule,
    BillingAccountsModule,
  ],
  controllers: [BillingController, PlansController, PersonalBillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
