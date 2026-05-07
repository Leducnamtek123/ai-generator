import { ApiKey } from '../../../../domain/api-key';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';

export class ApiKeyMapper {
  static toDomain(raw: ApiKeyEntity): ApiKey {
    const domainEntity = new ApiKey();
    domainEntity.id = raw.id;
    domainEntity.key = raw.key;
    domainEntity.keyPrefix = raw.keyPrefix;
    domainEntity.keyLast4 = raw.keyLast4;
    domainEntity.name = raw.name;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    domainEntity.lastUsedAt = raw.lastUsedAt;
    domainEntity.expiresAt = raw.expiresAt;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: ApiKey): ApiKeyEntity {
    const persistenceEntity = new ApiKeyEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.key = domainEntity.key;
    persistenceEntity.keyPrefix = domainEntity.keyPrefix;
    persistenceEntity.keyLast4 = domainEntity.keyLast4;
    persistenceEntity.name = domainEntity.name;
    if (domainEntity.user) {
      persistenceEntity.user = UserMapper.toPersistence(domainEntity.user);
    }
    persistenceEntity.lastUsedAt = domainEntity.lastUsedAt;
    persistenceEntity.expiresAt = domainEntity.expiresAt;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity;
  }
}
