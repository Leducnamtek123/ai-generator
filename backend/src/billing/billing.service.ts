import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
import { defineAbilityFor, OrgAction } from '../permissions/permissions';
import { RoleEnum } from '../roles/roles.enum';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly orgRepository: OrganizationRepository,
    private readonly billingAccountsService: BillingAccountsService,
  ) {}

  async getBilling(
    orgSlug: string,
    userId: number,
    userRole?: { id?: number | string },
  ) {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const isPlatformAdmin = Number(userRole?.id) === RoleEnum.admin;
    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member && !isPlatformAdmin) {
      throw new ForbiddenException('Not a member');
    }

    if (member) {
      const ability = defineAbilityFor({
        id: userId,
        role: member.role as any,
        ownerId: org.ownerId,
      });

      if (!ability.can(OrgAction.Read, 'Billing')) {
        throw new ForbiddenException('Cannot view billing');
      }
    }

    const members = await this.memberRepository.findByOrganizationId(org.id);
    const billableMembers = members.filter((m) => m.role !== 'BILLING');
    const wallet = await this.billingAccountsService.getSummary(
      'organization',
      org.id,
    );
    const includedSeats = wallet.plan?.seatsIncluded || 1;
    const seatOverage = Math.max(0, billableMembers.length - includedSeats);
    const seatUnit = 10;
    const seatTotal = seatOverage * seatUnit;
    const planTotal = wallet.plan?.priceVnd || 0;

    return {
      organization: org,
      plan: wallet.plan,
      wallet,
      seats: {
        amount: billableMembers.length,
        included: includedSeats,
        overage: seatOverage,
        unit: seatUnit,
        total: seatTotal,
      },
      total: planTotal + seatTotal,
    };
  }
}
