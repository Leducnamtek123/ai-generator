import { NullableType } from '../../../utils/types/nullable.type';
import { Organization } from '../../domain/organization';

export abstract class OrganizationRepository {
  abstract create(
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Organization>;

  abstract findById(id: string): Promise<NullableType<Organization>>;
  abstract findBySlug(slug: string): Promise<NullableType<Organization>>;
  abstract findByDomain(domain: string): Promise<NullableType<Organization>>;
  abstract findByOwnerId(ownerId: number): Promise<Organization[]>;
  abstract findByUserId(userId: number): Promise<Organization[]>;

  abstract update(
    id: string,
    payload: Partial<Organization>,
  ): Promise<Organization | null>;

  abstract remove(id: string): Promise<void>;
}
