import { NullableType } from '../../../utils/types/nullable.type';
import { Asset } from '../../domain/asset';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class AssetRepository {
  abstract create(
    data: Omit<Asset, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Asset>;

  abstract findAllWithPagination(
    paginationOptions: IPaginationOptions,
    userId: string,
  ): Promise<Asset[]>;

  abstract findAllPublicWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<Asset[]>;

  abstract findById(id: Asset['id']): Promise<NullableType<Asset>>;

  abstract remove(id: Asset['id']): Promise<void>;
}
