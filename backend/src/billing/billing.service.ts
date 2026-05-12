import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { WorkspaceRepository } from '../workspaces/infrastructure/persistence/workspace.repository';
import { defineAbilityFor, WorkspaceAction } from '../permissions/permissions';
import { RoleEnum } from '../roles/roles.enum';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly billingAccountsService: BillingAccountsService,
  ) {}

  async getBilling(
    workspaceSlug: string,
    userId: number,
    userRole?: { id?: number | string },
  ) {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const isPlatformAdmin = Number(userRole?.id) === RoleEnum.admin;
    const member = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!member && !isPlatformAdmin) {
      throw new ForbiddenException('Not a member');
    }

    if (member) {
      const ability = defineAbilityFor({
        id: userId,
        role: member.role as any,
        ownerId: workspace.ownerId,
      });

      if (!ability.can(WorkspaceAction.Read, 'Billing')) {
        throw new ForbiddenException('Cannot view billing');
      }
    }

    const members = await this.memberRepository.findByWorkspaceId(workspace.id);
    const billableMembers = members.filter((m) => m.role !== 'BILLING');
    const wallet = await this.billingAccountsService.getSummary('workspace', workspace.id);
    const includedSeats = wallet.plan?.seatsIncluded || 1;
    const seatOverage = Math.max(0, billableMembers.length - includedSeats);
    const seatUnit = 10;
    const seatTotal = seatOverage * seatUnit;
    const planTotal = wallet.plan?.priceVnd || 0;

    return {
      workspace,
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
