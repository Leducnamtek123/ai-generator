import { Workflow } from '../../../../domain/workflow';
import { WorkflowEntity } from '../entities/workflow.entity';
import { ProjectMapper } from '../../../../../projects/infrastructure/persistence/relational/mappers/project.mapper';

export class WorkflowMapper {
  static toDomain(raw: WorkflowEntity): Workflow {
    const domainEntity = new Workflow();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.nodes = raw.nodes;
    domainEntity.edges = raw.edges;
    domainEntity.projectId = raw.projectId;
    if (raw.project) {
      domainEntity.project = ProjectMapper.toDomain(raw.project);
    }
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Workflow): WorkflowEntity {
    const persistenceEntity = new WorkflowEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name || '';
    persistenceEntity.nodes = domainEntity.nodes || [];
    persistenceEntity.edges = domainEntity.edges || [];
    persistenceEntity.projectId = domainEntity.projectId;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;

    return persistenceEntity;
  }
}
