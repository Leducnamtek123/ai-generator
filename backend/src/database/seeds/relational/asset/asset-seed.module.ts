import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetSeedService } from './asset-seed.service';
import { AssetEntity } from '../../../../assets/infrastructure/persistence/relational/entities/asset.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, UserEntity])],
  providers: [AssetSeedService],
  exports: [AssetSeedService],
})
export class AssetSeedModule {}
