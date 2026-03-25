import { Member, OrgRole } from '../../../../domain/member';
import { MemberEntity } from '../entities/member.entity';

export class MemberMapper {
  static toDomain(raw: MemberEntity): Member {
    const domain = new Member();
    domain.id = raw.id;
    domain.userId = raw.userId;
    domain.organizationId = raw.organizationId;
    domain.role = raw.role as unknown as OrgRole;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: Member): MemberEntity {
    const entity = new MemberEntity();
    if (domain.id) entity.id = domain.id;
    entity.userId = domain.userId;
    entity.organizationId = domain.organizationId;
    entity.role = domain.role as any;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
