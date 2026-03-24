import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from './infrastructure/persistence/organization.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  TransferOwnershipDto,
} from './dto/organization.dto';
import { Organization } from './domain/organization';
import { OrgRole } from '../members/domain/member';
import { defineAbilityFor, OrgAction } from '../permissions/permissions';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly orgRepository: OrganizationRepository,
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
    dto: CreateOrganizationDto,
    ownerId: number,
  ): Promise<Organization> {
    let slug = this.generateSlug(dto.name);

    // Ensure slug uniqueness
    const existing = await this.orgRepository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Check domain uniqueness
    if (dto.domain) {
      const existingDomain = await this.orgRepository.findByDomain(dto.domain);
      if (existingDomain) {
        throw new ConflictException('Domain already taken by another organization');
      }
    }

    const org = await this.orgRepository.create({
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
      organizationId: org.id,
      role: OrgRole.ADMIN,
    } as any);

    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepository.findBySlug(slug);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findById(id);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findByUserId(userId: number): Promise<Organization[]> {
    return this.orgRepository.findByUserId(userId);
  }

  async getMembership(userId: number, orgSlug: string) {
    const org = await this.findBySlug(orgSlug);
    const member = await this.memberRepository.findByUserAndOrg(
      userId,
      org.id,
    );
    if (!member) throw new ForbiddenException('Not a member of this organization');
    return { org, member };
  }

  async update(
    orgSlug: string,
    userId: number,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const { org, member } = await this.getMembership(userId, orgSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Update, 'Organization')) {
      throw new ForbiddenException('Cannot update this organization');
    }

    // Check domain uniqueness if changing
    if (dto.domain && dto.domain !== org.domain) {
      const existingDomain = await this.orgRepository.findByDomain(dto.domain);
      if (existingDomain) {
        throw new ConflictException('Domain already taken');
      }
    }

    const updated = await this.orgRepository.update(org.id, dto);
    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }

  async shutdown(orgSlug: string, userId: number): Promise<void> {
    const { org, member } = await this.getMembership(userId, orgSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.Delete, 'Organization')) {
      throw new ForbiddenException('Cannot delete this organization');
    }

    await this.orgRepository.remove(org.id);
  }

  async transferOwnership(
    orgSlug: string,
    userId: number,
    dto: TransferOwnershipDto,
  ): Promise<Organization> {
    const { org, member } = await this.getMembership(userId, orgSlug);

    const ability = defineAbilityFor({
      id: userId,
      role: member.role as any,
      ownerId: org.ownerId,
    });

    if (!ability.can(OrgAction.TransferOwnership, 'Organization')) {
      throw new ForbiddenException('Only the owner can transfer ownership');
    }

    const targetMember = await this.memberRepository.findById(dto.memberId);
    if (!targetMember || targetMember.organizationId !== org.id) {
      throw new NotFoundException('Target member not found in this organization');
    }

    // Update org owner
    const updated = await this.orgRepository.update(org.id, {
      ownerId: targetMember.userId,
    });

    // Make new owner ADMIN
    await this.memberRepository.update(targetMember.id, {
      role: OrgRole.ADMIN,
    });

    if (!updated) throw new NotFoundException('Organization not found');
    return updated;
  }
}
