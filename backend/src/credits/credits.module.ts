import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPersistenceModule],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService, RelationalPersistenceModule],
})
export class CreditsModule {}
