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
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
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
    private organizationRepository: OrganizationRepository,
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
    const orgSlug = request.params?.orgSlug;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!orgSlug) {
      // No org context, check basic permissions
      const ability = defineAbilityFor({
        id: user.id,
        role: normalizePlatformRole(user.role),
      });
      return requiredPermissions.every((perm) =>
        ability.can(perm.action, perm.subject as any),
      );
    }

    // Get org and membership
    const org = await this.organizationRepository.findBySlug(orgSlug);
    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    const member = await this.memberRepository.findByUserAndOrg(
      user.id,
      org.id,
    );
    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // Store org and member on request for controllers
    request.organization = org;
    request.membership = member;

    const ability = defineAbilityFor({
      id: user.id,
      role: member.role as 'ADMIN' | 'MEMBER' | 'BILLING',
      ownerId: org.ownerId,
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
