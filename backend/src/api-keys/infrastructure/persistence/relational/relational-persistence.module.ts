import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from './entities/api-key.entity';
import { ApiKeyRepository } from '../api-key.repository';
import { ApiKeyRelationalRepository } from './repositories/api-key.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity])],
  providers: [
    {
      provide: ApiKeyRepository,
      useClass: ApiKeyRelationalRepository,
    },
  ],
  exports: [ApiKeyRepository],
})
export class RelationalApiKeyPersistenceModule {}
