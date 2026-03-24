import { NullableType } from '../../../utils/types/nullable.type';
import { Member } from '../../domain/member';

export abstract class MemberRepository {
  abstract create(
    data: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Member>;

  abstract findById(id: string): Promise<NullableType<Member>>;
  abstract findByUserAndOrg(
    userId: number,
    organizationId: string,
  ): Promise<NullableType<Member>>;
  abstract findByOrganizationId(organizationId: string): Promise<Member[]>;

  abstract update(
    id: string,
    payload: Partial<Member>,
  ): Promise<Member | null>;

  abstract remove(id: string): Promise<void>;
}
