import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingAccountsService } from './billing-accounts.service';
import { BillingAccountEntity } from './infrastructure/persistence/relational/entities/billing-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BillingAccountEntity])],
  providers: [BillingAccountsService],
  exports: [BillingAccountsService],
})
export class BillingAccountsModule {}
