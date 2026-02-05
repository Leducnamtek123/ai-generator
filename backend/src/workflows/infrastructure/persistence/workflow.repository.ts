import { Workflow } from '../../domain/workflow';
import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';

export abstract class WorkflowRepository {
  abstract create(
    data: Omit<
      Workflow,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'project'
    >,
  ): Promise<Workflow>;

  abstract findAll(userId: string): Promise<Workflow[]>;
  abstract findCommunity(): Promise<Workflow[]>;

  abstract findByProject(
    projectId: string,
    userId: string | number,
  ): Promise<Workflow[]>;

  abstract findById(
    id: Workflow['id'],
    userId?: string | number,
  ): Promise<NullableType<Workflow>>;

  abstract update(
    id: Workflow['id'],
    userId: string | number,
    payload: DeepPartial<Workflow>,
  ): Promise<Workflow | null>;

  abstract remove(id: Workflow['id'], userId: string | number): Promise<void>;
}
