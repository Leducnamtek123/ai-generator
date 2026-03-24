import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InviteRepository } from './infrastructure/persistence/invite.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
import { Invite } from './domain/invite';
import { OrgRole } from '../members/domain/member';
import { CreateInviteDto } from '../members/dto/member.dto';
import { defineAbilityFor, OrgAction } from '../permissions/permissions';

@Injectable()
export class InvitesService {
  constructor(
    private readonly inviteRepository: InviteRepository,
    private readonly memberRepository: MemberRepository,
    private readonly orgRepository: OrganizationRepository,
  ) {}

  async create(
    orgSlug: string,
    userId: number,
    dto: CreateInviteDto,
  ): Promise<Invite> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Create, 'Invite')) {
      throw new ForbiddenException('Cannot create invites');
    }

    // Check if already invited
    const existing = await this.inviteRepository.findByOrgAndEmail(
      org.id,
      dto.email,
    );
    if (existing) {
      throw new ConflictException('User already invited');
    }

    return this.inviteRepository.create({
      authorId: userId,
      organizationId: org.id,
      email: dto.email,
      role: dto.role || OrgRole.MEMBER,
    } as any);
  }

  async findByOrganization(
    orgSlug: string,
    userId: number,
  ): Promise<Invite[]> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Read, 'Invite')) {
      throw new ForbiddenException('Cannot view invites');
    }

    return this.inviteRepository.findByOrganizationId(org.id);
  }

  async findPendingForUser(email: string): Promise<Invite[]> {
    return this.inviteRepository.findByEmail(email);
  }

  async accept(inviteId: string, userId: number, userEmail: string): Promise<void> {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.email !== userEmail) {
      throw new ForbiddenException('This invite is not for you');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findByUserAndOrg(
      userId,
      invite.organizationId,
    );
    if (existingMember) {
      // Already a member, just remove the invite
      await this.inviteRepository.remove(inviteId);
      return;
    }

    // Create membership
    await this.memberRepository.create({
      userId,
      organizationId: invite.organizationId,
      role: invite.role || OrgRole.MEMBER,
    } as any);

    // Remove invite
    await this.inviteRepository.remove(inviteId);
  }

  async reject(inviteId: string, userEmail: string): Promise<void> {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.email !== userEmail) {
      throw new ForbiddenException('This invite is not for you');
    }

    await this.inviteRepository.remove(inviteId);
  }

  async revoke(
    inviteId: string,
    orgSlug: string,
    userId: number,
  ): Promise<void> {
    const org = await this.orgRepository.findBySlug(orgSlug);
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.memberRepository.findByUserAndOrg(userId, org.id);
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Delete, 'Invite')) {
      throw new ForbiddenException('Cannot revoke invites');
    }

    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite || invite.organizationId !== org.id) {
      throw new NotFoundException('Invite not found');
    }

    await this.inviteRepository.remove(inviteId);
  }
}
