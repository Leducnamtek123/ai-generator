import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRepository } from './infrastructure/persistence/workspace.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  TransferWorkspaceOwnershipDto,
} from './dto/workspace.dto';
import { Workspace } from './domain/workspace';
import { WorkspaceRole } from '../members/domain/member';
import {
  defineAbilityFor,
  WorkspaceAction,
} from '../permissions/permissions';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  async create(
    dto: CreateWorkspaceDto,
    ownerId: number,
  ): Promise<Workspace> {
    let slug = this.generateSlug(dto.name);

    // Ensure slug uniqueness
    const existing = await this.workspaceRepository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Check domain uniqueness
    if (dto.domain) {
      const existingDomain = await this.workspaceRepository.findByDomain(dto.domain);
      if (existingDomain) {
        throw new ConflictException('Domain already taken by another workspace');
      }
    }

    const workspace = await this.workspaceRepository.create({
      name: dto.name,
      slug,
      url: dto.url || '',
      description: dto.description || '',
      domain: dto.domain || null,
      shouldAttachUsersByDomain: dto.shouldAttachUsersByDomain || false,
      avatarUrl: dto.avatarUrl || '',
      ownerId,
    } as any);

    // Create owner as ADMIN member
    await this.memberRepository.create({
      userId: ownerId,
      workspaceId: workspace.id,
      role: WorkspaceRole.ADMIN,
    } as any);

    return workspace;
  }

  async findBySlug(slug: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findBySlug(slug);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async findByUserId(userId: number): Promise<Workspace[]> {
    return this.workspaceRepository.findByUserId(userId);
  }

  async getMembership(userId: number, workspaceSlug: string) {
    const workspace = await this.findBySlug(workspaceSlug);
    const member = await this.memberRepository.findByUserAndWorkspace(
      userId,
      workspace.id,
    );
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    return { workspace, member };
  }

  async update(
    workspaceSlug: string,
    userId: number,
    dto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const { workspace, member } = await this.getMembership(userId, workspaceSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Update, 'Workspace')) {
      throw new ForbiddenException('Cannot update this workspace');
    }

    // Check domain uniqueness if changing
    if (dto.domain && dto.domain !== workspace.domain) {
      const existingDomain = await this.workspaceRepository.findByDomain(dto.domain);
      if (existingDomain) {
        throw new ConflictException('Domain already taken');
      }
    }

    const updated = await this.workspaceRepository.update(workspace.id, dto);
    if (!updated) throw new NotFoundException('Workspace not found');
    return updated;
  }

  async shutdown(workspaceSlug: string, userId: number): Promise<void> {
    const { workspace, member } = await this.getMembership(userId, workspaceSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.Delete, 'Workspace')) {
      throw new ForbiddenException('Cannot delete this workspace');
    }

    await this.workspaceRepository.remove(workspace.id);
  }

  async transferOwnership(
    workspaceSlug: string,
    userId: number,
    dto: TransferWorkspaceOwnershipDto,
  ): Promise<Workspace> {
    const { workspace, member } = await this.getMembership(userId, workspaceSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: workspace.ownerId,
    });

    if (!ability.can(WorkspaceAction.TransferOwnership, 'Workspace')) {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    const targetMember = await this.memberRepository.findById(dto.memberId);
    if (!targetMember || targetMember.workspaceId !== workspace.id) {
      throw new NotFoundException('Target member not found in this workspace');
    }

    // Update workspace owner
    const updated = await this.workspaceRepository.update(workspace.id, {
      ownerId: targetMember.userId,
    });

    // Make new owner ADMIN
    await this.memberRepository.update(targetMember.id, {
      role: WorkspaceRole.ADMIN,
    });

    if (!updated) throw new NotFoundException('Workspace not found');
    return updated;
  }

  async autoJoinByDomain(userId: number, domain: string): Promise<void> {
    const workspaces = await this.workspaceRepository.findManyByDomain(domain);
    for (const workspace of workspaces) {
      if (workspace.shouldAttachUsersByDomain) {
        // Check if already a member
        const member = await this.memberRepository.findByUserAndWorkspace(
          userId,
          workspace.id,
        );
        if (!member) {
          await this.memberRepository.create({
            userId,
            workspaceId: workspace.id,
            role: WorkspaceRole.MEMBER,
          } as any);
        }
      }
    }
  }
}
