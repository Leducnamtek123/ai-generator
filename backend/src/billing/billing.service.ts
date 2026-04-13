import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
import { defineAbilityFor, OrgAction } from '../permissions/permissions';

@Injectable()
export class BillingService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly orgRepository: OrganizationRepository,
  ) {}

  async getBilling(orgSlug: string, userId: number) {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Read, 'Billing')) {
      throw new ForbiddenException('Cannot view billing');
    }

    const members = await this.memberRepository.findByOrganizationId(org.id);

    // Billing logic from saas-rbac: $28/project, $10/member (excluding BILLING role)
    const billableMembers = members.filter((m) => m.role !== 'BILLING');

    return {
      organization: org,
      seats: {
        amount: billableMembers.length,
        unit: 10,
        total: billableMembers.length * 10,
      },
      total: billableMembers.length * 10,
    };
  }
}
