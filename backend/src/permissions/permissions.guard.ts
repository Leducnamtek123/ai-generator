import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_PERMISSIONS_KEY,
  RequiredPermission,
} from './permissions.decorator';
import { defineAbilityFor } from './permissions';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import { WorkspaceRepository } from '../workspaces/infrastructure/persistence/workspace.repository';
import { RoleEnum } from '../roles/roles.enum';

function normalizePlatformRole(
  role: unknown,
): 'OWNER' | 'ADMIN' | 'MEMBER' | 'BILLING' | 'VIEWER' {
  if (typeof role === 'string') {
    const lower = role.toLowerCase();
    if (lower === 'admin' || lower === 'administrator') return 'ADMIN';
    if (lower === 'owner') return 'OWNER';
    if (lower === 'billing') return 'BILLING';
    if (lower === 'viewer') return 'VIEWER';
  }

  if (role && typeof role === 'object') {
    const maybeName = (role as { name?: unknown }).name;
    if (typeof maybeName === 'string') {
      return normalizePlatformRole(maybeName);
    }

    const maybeId = (role as { id?: unknown }).id;
    if (String(maybeId) === String(RoleEnum.admin)) return 'ADMIN';
    if (String(maybeId) === String(RoleEnum.user)) return 'MEMBER';
  }

  return 'MEMBER';
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private memberRepository: MemberRepository,
    private workspaceRepository: WorkspaceRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(CHECK_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceSlug = request.params?.workspaceSlug;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!workspaceSlug) {
      // No workspace context, check basic permissions
      const ability = defineAbilityFor({
        id: user.id,
        role: normalizePlatformRole(user.role),
      });
      return requiredPermissions.every((perm) =>
        ability.can(perm.action, perm.subject as any),
      );
    }

    // Get workspace and membership
    const workspace = await this.workspaceRepository.findBySlug(workspaceSlug);
    if (!workspace) {
      throw new ForbiddenException('Workspace not found');
    }

    const member = await this.memberRepository.findByUserAndWorkspace(
      user.id,
      workspace.id,
    );
    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    // Store workspace and member on request for controllers
    request.workspace = workspace;
    request.membership = member;

    const ability = defineAbilityFor({
      id: user.id,
      role: member.role as 'ADMIN' | 'MEMBER' | 'BILLING',
      ownerId: workspace.ownerId,
    });

    const hasPermission = requiredPermissions.every((perm) =>
      ability.can(perm.action, perm.subject as any),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
