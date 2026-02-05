import { Module } from '@nestjs/common';
import { CreditRepository } from '../credit.repository';
import { CreditRelationalRepository } from './repositories/credit.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransactionEntity } from './entities/credit-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditTransactionEntity])],
  providers: [
    {
      provide: CreditRepository,
      useClass: CreditRelationalRepository,
    },
  ],
  exports: [CreditRepository],
})
export class RelationalPersistenceModule {}
