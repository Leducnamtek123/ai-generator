import { Injectable } from '@nestjs/common';
import { ApiKeyRepository } from './infrastructure/persistence/api-key.repository';
import { ApiKey } from './domain/api-key';
import { NullableType } from '../utils/types/nullable.type';
import { User } from '../users/domain/user';
import {
  buildApiKeyPreview,
  generateApiKeySecret,
  hashApiKeySecret,
} from './api-key.utils';

@Injectable()
export class ApiKeysService {
  constructor(private readonly apiKeysRepository: ApiKeyRepository) {}

  async create(
    data: Omit<
      ApiKey,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'key'
      | 'keyPrefix'
      | 'keyLast4'
      | 'lastUsedAt'
      | 'user'
    > & { user: Pick<User, 'id'> },
  ): Promise<{ apiKey: ApiKey; rawKey: string; preview: string }> {
    const rawKey = generateApiKeySecret();
    const keyHash = hashApiKeySecret(rawKey);
    const keyPrefix = rawKey.slice(0, 10);
    const keyLast4 = rawKey.slice(-4);
    const user = { id: data.user.id } as User;

    const apiKey = await this.apiKeysRepository.create({
      ...data,
      user,
      key: keyHash,
      keyPrefix,
      keyLast4,
      lastUsedAt: null,
    });

    return {
      apiKey,
      rawKey,
      preview: buildApiKeyPreview(keyPrefix, keyLast4),
    };
  }

  async findOne(fields: Partial<ApiKey>): Promise<NullableType<ApiKey>> {
    return this.apiKeysRepository.findOne(fields);
  }

  async findAll(fields: Partial<ApiKey>): Promise<ApiKey[]> {
    return this.apiKeysRepository.findAll(fields);
  }

  async findAllByUserId(userId: User['id']): Promise<ApiKey[]> {
    return this.apiKeysRepository.findAllByUserId(userId);
  }

  async findOneByIdAndUserId(
    id: ApiKey['id'],
    userId: User['id'],
  ): Promise<NullableType<ApiKey>> {
    return this.apiKeysRepository.findOneByIdAndUserId(id, userId);
  }

  async findByKey(key: string): Promise<NullableType<ApiKey>> {
    return this.apiKeysRepository.findOne({ key: hashApiKeySecret(key) });
  }

  async updateLastUsed(id: ApiKey['id']): Promise<void> {
    await this.apiKeysRepository.update(id, {
      lastUsedAt: new Date(),
    });
  }

  async softDelete(id: ApiKey['id']): Promise<void> {
    await this.apiKeysRepository.softDelete(id);
  }
}
