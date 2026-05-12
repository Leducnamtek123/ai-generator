import { NullableType } from '../../../utils/types/nullable.type';
import { Invite } from '../../domain/invite';

export abstract class InviteRepository {
  abstract create(
    data: Omit<Invite, 'id' | 'createdAt'>,
  ): Promise<Invite>;

  abstract findById(id: string): Promise<NullableType<Invite>>;
  abstract findByWorkspaceId(workspaceId: string): Promise<Invite[]>;
  abstract findByEmail(email: string): Promise<Invite[]>;
  abstract findByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<NullableType<Invite>>;

  abstract remove(id: string): Promise<void>;
}
