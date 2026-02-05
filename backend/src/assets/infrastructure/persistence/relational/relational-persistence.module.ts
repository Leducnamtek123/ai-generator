import { Module } from '@nestjs/common';
import { AssetRepository } from '../asset.repository';
import { AssetRelationalRepository } from './repositories/asset.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [
    {
      provide: AssetRepository,
      useClass: AssetRelationalRepository,
    },
  ],
  exports: [AssetRepository],
})
export class RelationalPersistenceModule {}
