import { NullableType } from '../../../utils/types/nullable.type';
import { Invite } from '../../domain/invite';

export abstract class InviteRepository {
  abstract create(
    data: Omit<Invite, 'id' | 'createdAt'>,
  ): Promise<Invite>;

  abstract findById(id: string): Promise<NullableType<Invite>>;
  abstract findByOrganizationId(organizationId: string): Promise<Invite[]>;
  abstract findByEmail(email: string): Promise<Invite[]>;
  abstract findByOrgAndEmail(
    organizationId: string,
    email: string,
  ): Promise<NullableType<Invite>>;

  abstract remove(id: string): Promise<void>;
}
