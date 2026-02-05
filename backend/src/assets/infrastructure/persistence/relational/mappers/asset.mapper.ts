import { Asset } from '../../../../domain/asset';
import { AssetEntity } from '../entities/asset.entity';

export class AssetMapper {
  static toDomain(raw: AssetEntity): Asset {
    const domainEntity = new Asset();
    domainEntity.id = raw.id;
    domainEntity.type = raw.type;
    domainEntity.url = raw.url;
    domainEntity.userId = raw.userId;
    domainEntity.projectId = raw.projectId;
    domainEntity.metadata = raw.metadata;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Asset): AssetEntity {
    const persistenceEntity = new AssetEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.url = domainEntity.url;
    persistenceEntity.userId = domainEntity.userId;
    persistenceEntity.projectId = domainEntity.projectId || ''; // Ensure string or handle null in entity
    persistenceEntity.metadata = domainEntity.metadata;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
