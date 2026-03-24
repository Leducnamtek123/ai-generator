import { Module } from '@nestjs/common';
import { BillingService, BillingController } from './billing.service';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { OrgRelationalPersistenceModule } from '../organizations/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [MemberRelationalPersistenceModule, OrgRelationalPersistenceModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
