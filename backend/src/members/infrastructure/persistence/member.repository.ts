import { NullableType } from '../../../utils/types/nullable.type';
import { Member } from '../../domain/member';

export abstract class MemberRepository {
  abstract create(
    data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Member>;

  abstract findById(id: string): Promise<NullableType<Member>>;
  abstract findByUserAndWorkspace(
    userId: number,
    workspaceId: string,
  ): Promise<NullableType<Member>>;
  abstract findByWorkspaceId(workspaceId: string): Promise<Member[]>;

  abstract update(
    id: string,
    payload: Partial<Member>,
  ): Promise<Member | null>;

  abstract remove(id: string): Promise<void>;
}
