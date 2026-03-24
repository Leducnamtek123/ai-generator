import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRepository } from './infrastructure/persistence/member.repository';
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
import { Member, OrgRole } from './domain/member';
import { UpdateMemberDto } from './dto/member.dto';
import { defineAbilityFor, OrgAction } from '../permissions/permissions';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly orgRepository: OrganizationRepository,
  ) {}

  async findByOrganization(
    orgSlug: string,
    userId: number,
  ): Promise<Member[]> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Read, 'User')) {
      throw new ForbiddenException('Cannot list members');
    }

    return this.memberRepository.findByOrganizationId(org.id);
  }

  async updateRole(
    orgSlug: string,
    memberId: string,
    userId: number,
    dto: UpdateMemberDto,
  ): Promise<Member> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const currentMember = await this.memberRepository.findByUserAndOrg(
      userId,
      org.id,
    );
    if (!currentMember) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: currentMember.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Update, 'User')) {
      throw new ForbiddenException('Cannot update member role');
    }

    const targetMember = await this.memberRepository.findById(memberId);
    if (!targetMember || targetMember.organizationId !== org.id) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (targetMember.userId === org.ownerId) {
      throw new ForbiddenException('Cannot change the owner\'s role');
    }

    const updated = await this.memberRepository.update(memberId, {
      role: dto.role,
    });
    if (!updated) throw new NotFoundException('Member not found');
    return updated;
  }

  async removeMember(
    orgSlug: string,
    memberId: string,
    userId: number,
  ): Promise<void> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const currentMember = await this.memberRepository.findByUserAndOrg(
      userId,
      org.id,
    );
    if (!currentMember) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: currentMember.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Delete, 'User')) {
      throw new ForbiddenException('Cannot remove members');
    }

    const targetMember = await this.memberRepository.findById(memberId);
    if (!targetMember || targetMember.organizationId !== org.id) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove the owner
    if (targetMember.userId === org.ownerId) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    await this.memberRepository.remove(memberId);
  }
}
