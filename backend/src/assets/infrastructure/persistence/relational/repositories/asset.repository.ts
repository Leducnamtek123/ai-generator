import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../entities/asset.entity';
import { AssetRepository } from '../../asset.repository';
import { Asset } from '../../../../domain/asset';
import { AssetMapper } from '../mappers/asset.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class AssetRelationalRepository implements AssetRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assetsRepository: Repository<AssetEntity>,
  ) {}

  async create(data: Asset): Promise<Asset> {
    const persistenceModel = AssetMapper.toPersistence(data);
    const newEntity = await this.assetsRepository.save(
      this.assetsRepository.create(persistenceModel),
    );
    return AssetMapper.toDomain(newEntity);
  }

  async findAllWithPagination(
    paginationOptions: IPaginationOptions,
    userId: string,
  ): Promise<Asset[]> {
    const entities = await this.assetsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => AssetMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NullableType<Asset>> {
    const entity = await this.assetsRepository.findOne({
      where: { id },
    });

    return entity ? AssetMapper.toDomain(entity) : null;
  }

  async remove(id: string): Promise<void> {
    await this.assetsRepository.softDelete(id);
  }
}
