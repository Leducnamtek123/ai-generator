import { Invite } from '../../../../domain/invite';
import { InviteEntity } from '../entities/invite.entity';
import { OrgRole } from '../../../.././../members/domain/member';

export class InviteMapper {
  static toDomain(raw: InviteEntity): Invite {
    const domain = new Invite();
    domain.id = raw.id;
    domain.authorId = raw.authorId;
    domain.organizationId = raw.organizationId;
    domain.email = raw.email;
    domain.role = raw.role as OrgRole;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: Invite): InviteEntity {
    const entity = new InviteEntity();
    if (domain.id) entity.id = domain.id;
    entity.authorId = domain.authorId as any;
    entity.organizationId = domain.organizationId;
    entity.email = domain.email;
    entity.role = domain.role as any;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
