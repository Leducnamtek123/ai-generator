import { Project } from '../../../../domain/project';
import { ProjectEntity } from '../entities/project.entity';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

export class ProjectMapper {
  static toDomain(raw: ProjectEntity): Project {
    const domainEntity = new Project() as Project & {
      organizationId?: string | null;
    };
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.description = raw.description;
    domainEntity.userId = raw.userId;
    domainEntity.thumbnail = raw.thumbnail;
    domainEntity.content = raw.content;
    domainEntity.organizationId = raw.organizationId;

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Project | DeepPartial<Project>): ProjectEntity {
    const persistenceEntity = new ProjectEntity() as ProjectEntity & {
      organizationId?: string | null;
    };
    const projectEntity = domainEntity as Project & {
      organizationId?: string | null;
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
    persistenceEntity.organizationId = projectEntity.organizationId ?? null;

    persistenceEntity.createdAt = projectEntity.createdAt as Date;
    persistenceEntity.updatedAt = projectEntity.updatedAt as Date;
    persistenceEntity.deletedAt = projectEntity.deletedAt as Date;

    return persistenceEntity;
  }
}
