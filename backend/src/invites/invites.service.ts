import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InviteRepository } from './infrastructure/persistence/invite.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { WorkspaceRepository } from '../workspaces/infrastructure/persistence/workspace.repository';
import { Invite } from './domain/invite';
import { WorkspaceRole } from '../members/domain/member';
import { CreateInviteDto } from '../members/dto/member.dto';
import { defineAbilityFor, WorkspaceAction } from '../permissions/permissions';

@Injectable()
export class InvitesService {
  constructor(
    private readonly inviteRepository: InviteRepository,
    private readonly memberRepository: MemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async create(
    workspaceSlug: string,
    userId: number,
    dto: CreateInviteDto,
  ): Promise<Invite> {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Create, 'Invite')) {
      throw new ForbiddenException('Cannot create invites');
    }

    // Check if already invited
    const existing = await this.inviteRepository.findByWorkspaceAndEmail(
      workspace.id,
      dto.email,
    );
    if (existing) {
      throw new ConflictException('User already invited');
    }

    return this.inviteRepository.create({
      authorId: userId,
      workspaceId: workspace.id,
      email: dto.email,
      role: dto.role || WorkspaceRole.MEMBER,
    } as any);
  }

  async findByWorkspace(
    workspaceSlug: string,
    userId: number,
  ): Promise<Invite[]> {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Read, 'Invite')) {
      throw new ForbiddenException('Cannot view invites');
    }

    return this.inviteRepository.findByWorkspaceId(workspace.id);
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
    const existingMember = await this.memberRepository.findByUserAndWorkspace(
      userId,
      invite.workspaceId,
    );
    if (existingMember) {
      // Already a member, just remove the invite
      await this.inviteRepository.remove(inviteId);
      return;
    }

    // Create membership
    await this.memberRepository.create({
      userId,
      workspaceId: invite.workspaceId,
      role: invite.role || WorkspaceRole.MEMBER,
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
    workspaceSlug: string,
    userId: number,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!member) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Delete, 'Invite')) {
      throw new ForbiddenException('Cannot revoke invites');
    }

    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite || invite.workspaceId !== workspace.id) {
      throw new NotFoundException('Invite not found');
    }

    await this.inviteRepository.remove(inviteId);
  }
}
