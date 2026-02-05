import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { Workflow } from '../../domain/workflow';

export abstract class WorkflowRepository {
  abstract create(
    data: Omit<
      Workflow,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'project'
    >,
  ): Promise<Workflow>;

  abstract findAll(userId: string): Promise<Workflow[]>;

  abstract findByProject(projectId: string): Promise<Workflow[]>;

  abstract findById(id: Workflow['id']): Promise<NullableType<Workflow>>;

  abstract update(
    id: Workflow['id'],
    payload: DeepPartial<Workflow>,
  ): Promise<Workflow | null>;

  abstract remove(id: Workflow['id']): Promise<void>;
}
