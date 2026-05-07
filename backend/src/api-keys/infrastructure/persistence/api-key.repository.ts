import { ApiKey } from '../../domain/api-key';
import { NullableType } from '../../../utils/types/nullable.type';
import { User } from '../../../users/domain/user';

export abstract class ApiKeyRepository {
  abstract create(
    data: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<ApiKey>;

  abstract findOne(fields: Partial<ApiKey>): Promise<NullableType<ApiKey>>;

  abstract findAll(fields: Partial<ApiKey>): Promise<ApiKey[]>;

  abstract findAllByUserId(userId: User['id']): Promise<ApiKey[]>;

  abstract findOneByIdAndUserId(
    id: ApiKey['id'],
    userId: User['id'],
  ): Promise<NullableType<ApiKey>>;

  abstract update(
    id: ApiKey['id'],
    payload: Partial<ApiKey>,
  ): Promise<ApiKey | null>;

  abstract softDelete(id: ApiKey['id']): Promise<void>;
}
