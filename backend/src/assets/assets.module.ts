import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalPersistenceModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService, RelationalPersistenceModule],
})
export class AssetsModule {}
