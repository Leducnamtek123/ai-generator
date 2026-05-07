import { Project } from '../../../../domain/project';
import { ProjectEntity } from '../entities/project.entity';

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
    domainEntity.organizationId = raw.organizationId;

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Project): ProjectEntity {
    const persistenceEntity = new ProjectEntity() as ProjectEntity & {
      organizationId?: string;
    };
    const projectEntity = domainEntity as Project & {
      organizationId?: string | null;
    };
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.description = domainEntity.description || '';
    persistenceEntity.userId = domainEntity.userId;
    persistenceEntity.thumbnail = domainEntity.thumbnail || '';
    persistenceEntity.organizationId = projectEntity.organizationId || '';

    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
