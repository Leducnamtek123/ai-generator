import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRepository } from './infrastructure/persistence/member.repository';
import { WorkspaceRepository } from '../workspaces/infrastructure/persistence/workspace.repository';
import { Member, WorkspaceRole } from './domain/member';
import { UpdateMemberDto } from './dto/member.dto';
import { defineAbilityFor, WorkspaceAction } from '../permissions/permissions';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async findByWorkspace(
    workspaceSlug: string,
    userId: number,
  ): Promise<Member[]> {
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

    if (!ability.can(WorkspaceAction.Read, 'User')) {
      throw new ForbiddenException('Cannot list members');
    }

    return this.memberRepository.findByWorkspaceId(workspace.id);
  }

  async updateRole(
    workspaceSlug: string,
    memberId: string,
    userId: number,
    dto: UpdateMemberDto,
  ): Promise<Member> {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const currentMember = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!currentMember) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: currentMember.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Update, 'User')) {
      throw new ForbiddenException('Cannot update member role');
    }

    const targetMember = await this.memberRepository.findById(memberId);
    if (!targetMember || targetMember.workspaceId !== workspace.id) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (targetMember.userId === workspace.ownerId) {
      throw new ForbiddenException('Cannot change the owner\'s role');
    }

    const updated = await this.memberRepository.update(memberId, {
      role: dto.role,
    });
    if (!updated) throw new NotFoundException('Member not found');
    return updated;
  }

  async removeMember(
    workspaceSlug: string,
    memberId: string,
    userId: number,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) throw new NotFoundException('Workspace not found');

    const currentMember = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!currentMember) throw new ForbiddenException('Not a member');

    const ability = defineAbilityFor({
      id: userId,
      role: currentMember.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Delete, 'User')) {
      throw new ForbiddenException('Cannot remove members');
    }

    const targetMember = await this.memberRepository.findById(memberId);
    if (!targetMember || targetMember.workspaceId !== workspace.id) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove the owner
    if (targetMember.userId === workspace.ownerId) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.memberRepository.remove(memberId);
  }
}
