import { NullableType } from '../../../utils/types/nullable.type';
import { Workspace } from '../../domain/workspace';

export abstract class WorkspaceRepository {
  abstract create(
    data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Workspace>;

  abstract findById(id: string): Promise<NullableType<Workspace>>;
  abstract findBySlug(slug: string): Promise<NullableType<Workspace>>;
  abstract findByDomain(domain: string): Promise<NullableType<Workspace>>;
  abstract findManyByDomain(domain: string): Promise<Workspace[]>;
  abstract findByOwnerId(ownerId: number): Promise<Workspace[]>;
  abstract findByUserId(userId: number): Promise<Workspace[]>;

  abstract update(
    id: string,
    payload: Partial<Workspace>,
  ): Promise<Workspace | null>;

  abstract remove(id: string): Promise<void>;
}
