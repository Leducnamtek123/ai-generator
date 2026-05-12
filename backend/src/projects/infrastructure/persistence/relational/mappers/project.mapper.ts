import { Project } from '../../../../domain/project';
import { ProjectEntity } from '../entities/project.entity';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

export class ProjectMapper {
  static toDomain(raw: ProjectEntity): Project {
    const domainEntity = new Project() as Project & {
      workspaceId?: string | null;
    };
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.userId = raw.userId;
    domainEntity.thumbnail = raw.thumbnail;
    domainEntity.content = raw.content;
    domainEntity.workspaceId = raw.workspaceId;

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Project | DeepPartial<Project>): ProjectEntity {
    const persistenceEntity = new ProjectEntity() as ProjectEntity & {
      workspaceId?: string | null;
    };
    const projectEntity = domainEntity as Project & {
      workspaceId?: string | null;
      content?: unknown;
    };
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = projectEntity.name;
    persistenceEntity.description = projectEntity.description || '';
    persistenceEntity.userId = projectEntity.userId;
    persistenceEntity.thumbnail = projectEntity.thumbnail || '';
    persistenceEntity.content = projectEntity.content ?? null;
    persistenceEntity.workspaceId = projectEntity.workspaceId ?? null;

    persistenceEntity.createdAt = projectEntity.createdAt as Date;
    persistenceEntity.updatedAt = projectEntity.updatedAt as Date;
    persistenceEntity.deletedAt = projectEntity.deletedAt as Date;

    return persistenceEntity;
  }
}
