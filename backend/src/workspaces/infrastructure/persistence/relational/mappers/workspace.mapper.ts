import { Workspace } from '../../../../domain/workspace';
import { WorkspaceEntity } from '../entities/workspace.entity';

export class WorkspaceMapper {
  static toDomain(raw: WorkspaceEntity): Workspace {
    const domain = new Workspace();
    domain.id = raw.id;
    domain.name = raw.name;
    domain.slug = raw.slug;
    domain.url = raw.url;
    domain.description = raw.description;
    domain.domain = raw.domain;
    domain.shouldAttachUsersByDomain = raw.shouldAttachUsersByDomain;
    domain.avatarUrl = raw.avatarUrl;
    domain.ownerId = raw.ownerId;
    domain.type = raw.type;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: Workspace): WorkspaceEntity {
    const entity = new WorkspaceEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.url = domain.url || '';
    entity.description = domain.description || '';
    entity.domain = domain.domain || null as any;
    entity.shouldAttachUsersByDomain = domain.shouldAttachUsersByDomain || false;
    entity.avatarUrl = domain.avatarUrl || '';
    entity.ownerId = domain.ownerId;
    entity.type = domain.type || 'TEAM';
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
