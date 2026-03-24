import { Organization } from '../../../../domain/organization';
import { OrganizationEntity } from '../entities/organization.entity';

export class OrganizationMapper {
  static toDomain(raw: OrganizationEntity): Organization {
    const domain = new Organization();
    domain.id = raw.id;
    domain.name = raw.name;
    domain.slug = raw.slug;
    domain.url = raw.url;
    domain.description = raw.description;
    domain.domain = raw.domain;
    domain.shouldAttachUsersByDomain = raw.shouldAttachUsersByDomain;
    domain.avatarUrl = raw.avatarUrl;
    domain.ownerId = raw.ownerId;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: Organization): OrganizationEntity {
    const entity = new OrganizationEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.url = domain.url || '';
    entity.description = domain.description || '';
    entity.domain = domain.domain || null as any;
    entity.shouldAttachUsersByDomain = domain.shouldAttachUsersByDomain || false;
    entity.avatarUrl = domain.avatarUrl || '';
    entity.ownerId = domain.ownerId;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
