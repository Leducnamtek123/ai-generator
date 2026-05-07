import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { AssetEntity } from '../assets/infrastructure/persistence/relational/entities/asset.entity';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { OrganizationEntity } from '../organizations/infrastructure/persistence/relational/entities/organization.entity';
import { MemberEntity, OrgRoleEnum } from '../members/infrastructure/persistence/relational/entities/member.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../statuses/infrastructure/persistence/relational/entities/status.entity';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';
import {
  EXTERNAL_CATALOG_SOURCES,
  type ExternalCatalogSource,
} from '../database/seeds/external-catalog/external-catalog.sources';
import {
  runExternalCatalogImport,
  type ExternalCatalogImportOptions,
} from '../database/seeds/external-catalog/run-external-catalog-import';
import { AdminAuditActor, AdminAuditService } from './admin-audit.service';
import { ImportExternalCatalogDto } from './dto/import-external-catalog.dto';
import { UpdateAdminTemplateDto } from './dto/update-admin-template.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { BulkUpdateAdminUsersDto } from './dto/bulk-update-admin-users.dto';
import { BulkUpdateAdminTemplatesDto } from './dto/bulk-update-admin-templates.dto';
import { BulkDeleteAdminAssetsDto } from './dto/bulk-delete-admin-assets.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminTemplatesDto } from './dto/query-admin-templates.dto';
import { QueryAdminAssetsDto } from './dto/query-admin-assets.dto';
import { QueryAdminOrganizationsDto } from './dto/query-admin-organizations.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';
import { UpdateAdminOrganizationDto } from './dto/update-admin-organization.dto';
import { UpdateAdminOrganizationMemberDto } from './dto/update-admin-organization-member.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory } from '../notifications/notifications.types';
import { NotificationType } from '../notifications/infrastructure/persistence/relational/entities/notification.entity';

type AdminNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
type AdminNotificationCategory = 'security' | 'moderation' | 'operations' | 'system';

export type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  severity: AdminNotificationSeverity;
  category: AdminNotificationCategory;
  createdAt: string;
  actionLabel?: string;
  actionHref?: string;
  meta?: Record<string, unknown>;
};

export type AdminNotificationFeed = {
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    success: number;
    unresolved: number;
  };
  data: AdminNotificationItem[];
};

type AdminPageResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

type AdminTemplateMarketplace = {
  listed?: boolean;
  featured?: boolean;
  priceCredits?: number;
  adminNote?: string;
  reviewedAt?: string;
};

type AdminTemplateBulkPayload = BulkUpdateAdminTemplatesDto & {
  ids: string[];
};

const safeLimit = (value = 20) => Math.min(Math.max(Number(value) || 20, 1), 100);
const safePage = (value = 1) => Math.max(Number(value) || 1, 1);

const toSearch = (value?: string) =>
  value?.trim().length ? `%${value.trim()}%` : undefined;

const formatActorLabel = (entry: AdminAuditLogEntity) => {
  const actor = entry.actorEmail ?? `#${entry.actorId}`;
  return `${actor}${entry.entityName ? ` · ${entry.entityName}` : ''}`;
};

const describeAction = (action: string) => {
  const labels: Record<string, string> = {
    'admin.user.update': 'User updated',
    'admin.users.bulk_update': 'Bulk user update',
    'admin.organization.update': 'Organization updated',
    'admin.organization.transfer_owner': 'Organization owner transferred',
    'admin.organization.member_update': 'Member role updated',
    'admin.organization.member_remove': 'Member removed',
    'admin.asset.delete': 'Asset deleted',
    'admin.assets.bulk_delete': 'Assets deleted in bulk',
    'admin.template.update': 'Template updated',
    'admin.templates.bulk_update': 'Templates updated in bulk',
    'admin.template.delete': 'Template deleted',
    'admin.templates.bulk_delete': 'Templates deleted in bulk',
    'admin.catalog.import': 'Catalog imported',
    'admin.catalog.import_dry_run': 'Catalog import dry run completed',
  };

  return labels[action] ?? action;
};

const buildCsv = (headers: string[], rows: Array<Array<unknown>>) => {
  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  return [headers.join(','), ...rows.map((row) => row.map(escapeCell).join(','))].join('\n');
};

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditService: AdminAuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  getSources(): ExternalCatalogSource[] {
    return EXTERNAL_CATALOG_SOURCES;
  }

  async getOverview() {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const templateRepository = this.dataSource.getRepository(TemplateEntity);
    const assetRepository = this.dataSource.getRepository(AssetEntity);
    const orgRepository = this.dataSource.getRepository(OrganizationEntity);
    const auditRepository = this.dataSource.getRepository(AdminAuditLogEntity);

    const [
      users,
      templates,
      assets,
      organizations,
      publicTemplates,
      communityTemplates,
      inactiveUsers,
      auditLogs,
    ] = await Promise.all([
      userRepository.count(),
      templateRepository.count(),
      assetRepository.count(),
      orgRepository.count(),
      templateRepository.count({ where: { visibility: 'public' } }),
      templateRepository.count({ where: { visibility: 'community' } }),
      userRepository.count({ where: { status: { id: 2 } } }),
      auditRepository.count(),
    ]);

    return {
      users,
      templates,
      assets,
      organizations,
      publicTemplates,
      communityTemplates,
      inactiveUsers,
      auditLogs,
      sources: EXTERNAL_CATALOG_SOURCES.length,
    };
  }

  async getNotifications(): Promise<AdminNotificationFeed> {
    const overview = await this.getOverview();
    const auditRepository = this.dataSource.getRepository(AdminAuditLogEntity);
    const recentAuditLogs = await auditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .take(20)
      .getMany();

    const alerts: AdminNotificationItem[] = [];

    const failureLogs = recentAuditLogs.filter((entry) => !entry.success).slice(0, 5);
    for (const entry of failureLogs) {
      alerts.push({
        id: `audit-failure:${entry.id}`,
        title: `${describeAction(entry.action)} failed`,
        message: `${formatActorLabel(entry)}${entry.error ? ` · ${entry.error}` : ''}`,
        severity: 'critical',
        category: 'security',
        createdAt: entry.createdAt.toISOString(),
        actionLabel: 'Open audit log',
        actionHref: '/admin',
        meta: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
        },
      });
    }

    if (overview.inactiveUsers > 0) {
      alerts.push({
        id: 'system:inactive-users',
        title: 'Inactive users need review',
        message: `${overview.inactiveUsers} user${overview.inactiveUsers === 1 ? '' : 's'} are currently inactive.`,
        severity: 'warning',
        category: 'system',
        createdAt: recentAuditLogs[0]?.createdAt?.toISOString?.() ?? new Date().toISOString(),
        actionLabel: 'Review users',
        actionHref: '/admin',
        meta: { inactiveUsers: overview.inactiveUsers },
      });
    }

    const importantActions = new Set([
      'admin.user.update',
      'admin.users.bulk_update',
      'admin.organization.update',
      'admin.organization.transfer_owner',
      'admin.organization.member_update',
      'admin.organization.member_remove',
      'admin.asset.delete',
      'admin.assets.bulk_delete',
      'admin.template.update',
      'admin.templates.bulk_update',
      'admin.template.delete',
      'admin.templates.bulk_delete',
      'admin.catalog.import',
      'admin.catalog.import_dry_run',
    ]);

    const operationalLogs = recentAuditLogs
      .filter((entry) => entry.success && importantActions.has(entry.action))
      .slice(0, 5);

    for (const entry of operationalLogs) {
      alerts.push({
        id: `audit-info:${entry.id}`,
        title: describeAction(entry.action),
        message: formatActorLabel(entry),
        severity: entry.action.includes('bulk') || entry.action.includes('delete') ? 'warning' : 'info',
        category: 'operations',
        createdAt: entry.createdAt.toISOString(),
        actionLabel: 'Open admin console',
        actionHref: '/admin',
        meta: {
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
        },
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'admin:empty',
        title: 'No active admin alerts',
        message: 'Moderation, catalog, security, and operational alerts will appear here when something needs attention.',
        severity: 'success',
        category: 'system',
        createdAt: new Date().toISOString(),
        actionLabel: 'Open audit logs',
        actionHref: '/admin',
      });
    }

    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summary = alerts.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.severity] += 1;
        if (item.severity !== 'success') {
          acc.unresolved += 1;
        }
        return acc;
      },
      {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        success: 0,
        unresolved: 0,
      },
    );

    return {
      summary,
      data: alerts,
    };
  }

  async getRolesMatrix() {
    return {
      platformRoles: [
        {
          id: 1,
          name: 'Admin',
          canAccessAdmin: true,
          canManageUsers: true,
          canManageTemplates: true,
          canManageAssets: true,
          canManageOrganizations: true,
          canViewAuditLogs: true,
        },
        {
          id: 2,
          name: 'User',
          canAccessAdmin: false,
          canManageUsers: false,
          canManageTemplates: false,
          canManageAssets: false,
          canManageOrganizations: false,
          canViewAuditLogs: false,
        },
      ],
      userStatuses: [
        { id: 1, name: 'Active' },
        { id: 2, name: 'Inactive' },
      ],
      organizationRoles: [
        { id: OrgRoleEnum.ADMIN, name: 'Admin', canManageMembers: true, canTransferOwnership: true, canBill: true },
        { id: OrgRoleEnum.MEMBER, name: 'Member', canManageMembers: false, canTransferOwnership: false, canBill: false },
        { id: OrgRoleEnum.BILLING, name: 'Billing', canManageMembers: false, canTransferOwnership: false, canBill: true },
      ],
      templateVisibility: ['public', 'community', 'private'],
      moderationActions: [
        'bulk list / unlist',
        'bulk feature / unfeature',
        'bulk update price',
        'bulk delete',
        'bulk activate / deactivate users',
      ],
    };
  }

  private async log(
    actor: AdminAuditActor,
    payload: {
      action: string;
      entityType: string;
      entityId?: string | null;
      entityName?: string | null;
      before?: Record<string, unknown> | null;
      after?: Record<string, unknown> | null;
      meta?: Record<string, unknown> | null;
      success?: boolean;
      error?: string | null;
    },
  ) {
    await this.auditService.record({
      actor,
      ...payload,
    });
  }

  private getUserRepo(): Repository<UserEntity> {
    return this.dataSource.getRepository(UserEntity);
  }

  private getTemplateRepo(): Repository<TemplateEntity> {
    return this.dataSource.getRepository(TemplateEntity);
  }

  private getAssetRepo(): Repository<AssetEntity> {
    return this.dataSource.getRepository(AssetEntity);
  }

  private getOrgRepo(): Repository<OrganizationEntity> {
    return this.dataSource.getRepository(OrganizationEntity);
  }

  private getMemberRepo(): Repository<MemberEntity> {
    return this.dataSource.getRepository(MemberEntity);
  }

  private templateMarketplace(template: TemplateEntity): AdminTemplateMarketplace {
    const content = (template.content as Record<string, unknown> | null | undefined) ?? {};
    const marketplace = (content.marketplace ?? {}) as AdminTemplateMarketplace;
    return {
      listed: Boolean(marketplace.listed),
      featured: Boolean(marketplace.featured),
      priceCredits: Number(marketplace.priceCredits ?? 0) || 0,
      adminNote: marketplace.adminNote,
      reviewedAt: marketplace.reviewedAt,
    };
  }

  private async notifyTemplateAuthors(
    templates: TemplateEntity[],
    payload: {
      title: string;
      message: (count: number, templateTitles: string[]) => string;
      type: NotificationType;
      emailSubject: (count: number) => string;
    },
  ) {
    const grouped = new Map<
      number,
      { templateTitles: string[] }
    >();

    for (const template of templates) {
      const authorId = template.author?.id;
      if (!authorId) continue;

      const entry = grouped.get(authorId) ?? {
        templateTitles: [],
      };
      entry.templateTitles.push(template.title);
      grouped.set(authorId, entry);
    }

    for (const [authorId, entry] of grouped.entries()) {
      await this.notificationsService.notifyUser({
        userId: authorId,
        category: NotificationCategory.MODERATION,
        type: payload.type,
        title: payload.title,
        message: payload.message(entry.templateTitles.length, entry.templateTitles),
        emailSubject: payload.emailSubject(entry.templateTitles.length),
      });
    }
  }

  async getUsers(filters: QueryAdminUsersDto = {}): Promise<AdminPageResponse<UserEntity>> {
    const page = safePage(filters.page);
    const limit = safeLimit(filters.limit);
    const qb = this.getUserRepo()
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.status', 'status')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.roleId !== undefined) {
      qb.andWhere('role.id = :roleId', { roleId: filters.roleId });
    }

    if (filters.statusId !== undefined) {
      qb.andWhere('status.id = :statusId', { statusId: filters.statusId });
    }

    const query = toSearch(filters.q);
    if (query) {
      qb.andWhere(
        '(user.email ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query OR role.name ILIKE :query OR status.name ILIKE :query)',
        { query },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, hasNextPage: page * limit < total };
  }

  async exportUsers(filters: QueryAdminUsersDto = {}) {
    const { data } = await this.getUsers({ ...filters, page: 1, limit: 100 });
    return buildCsv(
      ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt'],
      data.map((user) => [
        user.id,
        user.email ?? '',
        user.firstName ?? '',
        user.lastName ?? '',
        user.role?.name ?? '',
        user.status?.name ?? '',
        user.createdAt?.toISOString?.() ?? '',
      ]),
    );
  }

  async updateUser(
    userId: number,
    dto: UpdateAdminUserDto,
    actor?: AdminAuditActor,
  ) {
    const userRepository = this.getUserRepo();
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'status'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const before = {
      roleId: user.role?.id ?? null,
      statusId: user.status?.id ?? null,
    };

    if (dto.roleId !== undefined) {
      user.role = { id: dto.roleId } as RoleEntity;
    }

    if (dto.statusId !== undefined) {
      user.status = { id: dto.statusId } as StatusEntity;
    }

    const saved = await userRepository.save(user);

    if (actor) {
      await this.log(actor, {
        action: 'admin.user.update',
        entityType: 'user',
        entityId: String(saved.id),
        entityName: saved.email ?? `${saved.firstName ?? ''} ${saved.lastName ?? ''}`.trim(),
        before,
        after: {
          roleId: saved.role?.id ?? null,
          statusId: saved.status?.id ?? null,
        },
        meta: dto as Record<string, unknown>,
      });
    }

    return saved;
  }

  async bulkUpdateUsers(dto: BulkUpdateAdminUsersDto, actor: AdminAuditActor) {
    if (dto.roleId === undefined && dto.statusId === undefined) {
      throw new BadRequestException('Provide a roleId or statusId for bulk update');
    }

    const results: UserEntity[] = [];
    for (const id of dto.ids) {
      results.push(await this.updateUser(id, dto, actor));
    }

    await this.log(actor, {
      action: 'admin.users.bulk_update',
      entityType: 'user',
      meta: {
        ids: dto.ids,
        roleId: dto.roleId ?? null,
        statusId: dto.statusId ?? null,
        count: results.length,
      },
    });

    return { updated: results.length, ids: dto.ids };
  }

  async getOrganizations(
    filters: QueryAdminOrganizationsDto = {},
  ): Promise<AdminPageResponse<OrganizationEntity & { memberCount: number }>> {
    const page = safePage(filters.page);
    const limit = safeLimit(filters.limit);
    const qb = this.getOrgRepo()
      .createQueryBuilder('organization')
      .loadRelationCountAndMap('organization.memberCount', 'organization.members')
      .orderBy('organization.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.ownerId !== undefined) {
      qb.andWhere('organization.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    if (filters.slug?.trim()) {
      qb.andWhere('organization.slug ILIKE :slug', { slug: toSearch(filters.slug) });
    }

    if (filters.domain?.trim()) {
      qb.andWhere('organization.domain ILIKE :domain', { domain: toSearch(filters.domain) });
    }

    if (filters.q?.trim()) {
      qb.andWhere(
        '(organization.name ILIKE :query OR organization.slug ILIKE :query OR COALESCE(organization.domain, \'\') ILIKE :query OR COALESCE(organization.description, \'\') ILIKE :query)',
        { query: toSearch(filters.q) },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data: data as any, total, page, limit, hasNextPage: page * limit < total };
  }

  async exportOrganizations(filters: QueryAdminOrganizationsDto = {}) {
    const { data } = await this.getOrganizations({ ...filters, page: 1, limit: 100 });
    return buildCsv(
      ['id', 'name', 'slug', 'domain', 'ownerId', 'memberCount', 'createdAt'],
      data.map((org: any) => [
        org.id,
        org.name,
        org.slug,
        org.domain ?? '',
        org.ownerId,
        org.memberCount ?? 0,
        org.createdAt?.toISOString?.() ?? '',
      ]),
    );
  }

  async getOrganizationDetail(orgId: string) {
    const org = await this.getOrgRepo().findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const members = await this.getMemberRepo()
      .createQueryBuilder('member')
      .leftJoin(UserEntity, 'user', 'user.id = member.userId')
      .select([
        'member.id AS id',
        'member.userId AS "userId"',
        'member.organizationId AS "organizationId"',
        'member.role AS role',
        'member.createdAt AS "createdAt"',
        'member.updatedAt AS "updatedAt"',
        'user.id AS "userIdValue"',
        'user.email AS "userEmail"',
        'user.firstName AS "userFirstName"',
        'user.lastName AS "userLastName"',
      ])
      .where('member.organizationId = :orgId', { orgId })
      .orderBy('member.createdAt', 'DESC')
      .getRawMany();

    return {
      ...org,
      memberCount: members.length,
      members: members.map((row) => ({
        id: row.id,
        userId: Number(row.userId),
        organizationId: row.organizationId,
        role: row.role,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: Number(row.userIdValue),
          email: row.userEmail,
          firstName: row.userFirstName,
          lastName: row.userLastName,
        },
      })),
    };
  }

  async updateOrganization(
    orgId: string,
    dto: UpdateAdminOrganizationDto,
    actor?: AdminAuditActor,
  ) {
    const orgRepository = this.getOrgRepo();
    const org = await orgRepository.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const before = {
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      ownerId: org.ownerId,
      shouldAttachUsersByDomain: org.shouldAttachUsersByDomain,
    };

    Object.assign(org, {
      name: dto.name ?? org.name,
      slug: dto.slug ?? org.slug,
      url: dto.url ?? org.url,
      description: dto.description ?? org.description,
      domain: dto.domain === undefined ? org.domain : dto.domain,
      shouldAttachUsersByDomain:
        dto.shouldAttachUsersByDomain ?? org.shouldAttachUsersByDomain,
      avatarUrl: dto.avatarUrl ?? org.avatarUrl,
      ownerId: dto.ownerId ?? org.ownerId,
    });

    const saved = await orgRepository.save(org);

    if (actor) {
      await this.log(actor, {
        action: 'admin.organization.update',
        entityType: 'organization',
        entityId: saved.id,
        entityName: saved.name,
        before,
        after: {
          name: saved.name,
          slug: saved.slug,
          domain: saved.domain,
          ownerId: saved.ownerId,
          shouldAttachUsersByDomain: saved.shouldAttachUsersByDomain,
        },
        meta: dto as Record<string, unknown>,
      });
    }

    return saved;
  }

  async transferOrganizationOwnership(
    orgId: string,
    memberId: string,
    actor: AdminAuditActor,
  ) {
    const org = await this.getOrgRepo().findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const memberRepo = this.getMemberRepo();
    const targetMember = await memberRepo.findOne({ where: { id: memberId } });
    if (!targetMember || targetMember.organizationId !== org.id) {
      throw new NotFoundException('Target member not found in this organization');
    }

    const before = { ownerId: org.ownerId };
    org.ownerId = targetMember.userId;
    await this.getOrgRepo().save(org);

    if (targetMember.role !== OrgRoleEnum.ADMIN) {
      targetMember.role = OrgRoleEnum.ADMIN;
      await memberRepo.save(targetMember);
    }

    await this.log(actor, {
      action: 'admin.organization.transfer_owner',
      entityType: 'organization',
      entityId: org.id,
      entityName: org.name,
      before,
      after: { ownerId: org.ownerId },
      meta: { memberId, targetUserId: targetMember.userId },
    });

    return this.getOrganizationDetail(org.id);
  }

  async updateOrganizationMember(
    orgId: string,
    memberId: string,
    dto: UpdateAdminOrganizationMemberDto,
    actor: AdminAuditActor,
  ) {
    const org = await this.getOrgRepo().findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const memberRepo = this.getMemberRepo();
    const member = await memberRepo.findOne({ where: { id: memberId } });
    if (!member || member.organizationId !== org.id) {
      throw new NotFoundException('Member not found');
    }

    if (member.userId === org.ownerId) {
      throw new BadRequestException('Cannot change the owner member role');
    }

    const before = { role: member.role };
    member.role = dto.role ?? member.role;
    const saved = await memberRepo.save(member);

    await this.log(actor, {
      action: 'admin.organization.member_update',
      entityType: 'member',
      entityId: saved.id,
      entityName: `${saved.userId}`,
      before,
      after: { role: saved.role },
      meta: { organizationId: org.id },
    });

    return saved;
  }

  async deleteOrganizationMemberInternal(
    orgId: string,
    memberId: string,
    actor: AdminAuditActor,
  ) {
    const org = await this.getOrgRepo().findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const memberRepo = this.getMemberRepo();
    const member = await memberRepo.findOne({ where: { id: memberId } });
    if (!member || member.organizationId !== org.id) {
      throw new NotFoundException('Member not found');
    }

    if (member.userId === org.ownerId) {
      throw new BadRequestException('Cannot remove the organization owner');
    }

    await memberRepo.delete(memberId);
    await this.log(actor, {
      action: 'admin.organization.member_remove',
      entityType: 'member',
      entityId: memberId,
      entityName: `${member.userId}`,
      meta: { organizationId: org.id },
    });
    return { success: true };
  }

  async getAssets(filters: QueryAdminAssetsDto = {}): Promise<AdminPageResponse<AssetEntity>> {
    const page = safePage(filters.page);
    const limit = safeLimit(filters.limit);
    const qb = this.getAssetRepo()
      .createQueryBuilder('asset')
      .orderBy('asset.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.type?.trim()) {
      qb.andWhere('asset.type = :type', { type: filters.type.trim() });
    }

    if (filters.userId?.trim()) {
      qb.andWhere('asset.userId = :userId', { userId: filters.userId.trim() });
    }

    if (filters.projectId?.trim()) {
      qb.andWhere('asset.projectId = :projectId', { projectId: filters.projectId.trim() });
    }

    if (filters.q?.trim()) {
      qb.andWhere(
        '(asset.url ILIKE :query OR CAST(asset.metadata AS TEXT) ILIKE :query OR asset.projectId ILIKE :query)',
        { query: toSearch(filters.q) },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, hasNextPage: page * limit < total };
  }

  async exportAssets(filters: QueryAdminAssetsDto = {}) {
    const { data } = await this.getAssets({ ...filters, page: 1, limit: 100 });
    return buildCsv(
      ['id', 'type', 'url', 'userId', 'projectId', 'createdAt'],
      data.map((asset) => [
        asset.id,
        asset.type,
        asset.url,
        asset.userId,
        asset.projectId ?? '',
        asset.createdAt?.toISOString?.() ?? '',
      ]),
    );
  }

  async removeAsset(assetId: string, actor?: AdminAuditActor) {
    const assetRepo = this.getAssetRepo();
    const asset = await assetRepo.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    await assetRepo.softDelete(assetId);

    if (actor) {
      await this.log(actor, {
        action: 'admin.asset.delete',
        entityType: 'asset',
        entityId: asset.id,
        entityName: asset.url,
        before: {
          type: asset.type,
          userId: asset.userId,
          projectId: asset.projectId,
        },
      });
    }

    return { success: true };
  }

  async bulkDeleteAssets(dto: BulkDeleteAdminAssetsDto, actor: AdminAuditActor) {
    const assetRepo = this.getAssetRepo();
    const assets = await assetRepo.find({ where: { id: In(dto.ids) } });
    if (assets.length === 0) {
      throw new NotFoundException('No matching assets found');
    }

    await assetRepo.softDelete(dto.ids);
    await this.log(actor, {
      action: 'admin.assets.bulk_delete',
      entityType: 'asset',
      meta: { ids: dto.ids, count: assets.length },
    });

    return { deleted: assets.length, ids: dto.ids };
  }

  async getTemplates(
    filters: QueryAdminTemplatesDto = {},
  ): Promise<AdminPageResponse<TemplateEntity>> {
    const page = safePage(filters.page);
    const limit = safeLimit(filters.limit);
    const qb = this.getTemplateRepo()
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author')
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.type?.trim()) {
      qb.andWhere('template.type = :type', { type: filters.type.trim() });
    }

    if (filters.visibility?.trim()) {
      qb.andWhere('template.visibility = :visibility', {
        visibility: filters.visibility.trim(),
      });
    }

    if (filters.authorId?.trim()) {
      qb.andWhere('template.authorId = :authorId', { authorId: filters.authorId.trim() });
    }

    if (filters.listed !== undefined) {
      qb.andWhere(
        "COALESCE((template.content->'marketplace'->>'listed')::boolean, false) = :listed",
        { listed: filters.listed },
      );
    }

    if (filters.featured !== undefined) {
      qb.andWhere(
        "COALESCE((template.content->'marketplace'->>'featured')::boolean, false) = :featured",
        { featured: filters.featured },
      );
    }

    if (filters.q?.trim()) {
      qb.andWhere(
        '(template.title ILIKE :query OR template.description ILIKE :query OR author.email ILIKE :query OR author.firstName ILIKE :query OR author.lastName ILIKE :query)',
        { query: toSearch(filters.q) },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, hasNextPage: page * limit < total };
  }

  async exportTemplates(filters: QueryAdminTemplatesDto = {}) {
    const { data } = await this.getTemplates({ ...filters, page: 1, limit: 100 });
    return buildCsv(
      ['id', 'title', 'type', 'visibility', 'listed', 'featured', 'priceCredits', 'author', 'createdAt'],
      data.map((template) => {
        const marketplace = this.templateMarketplace(template);
        return [
          template.id,
          template.title,
          template.type,
          template.visibility,
          marketplace.listed ? 'true' : 'false',
          marketplace.featured ? 'true' : 'false',
          marketplace.priceCredits ?? 0,
          template.author?.email ?? '',
          template.createdAt?.toISOString?.() ?? '',
        ];
      }),
    );
  }

  private async updateTemplateInternal(
    template: TemplateEntity,
    dto: UpdateAdminTemplateDto,
  ) {
    const content = (template.content as Record<string, unknown> | null | undefined) ?? {};
    const marketplace = (content.marketplace ?? {}) as AdminTemplateMarketplace;

    if (dto.visibility) {
      template.visibility = dto.visibility;
    }

    if (dto.listed !== undefined) {
      marketplace.listed = dto.listed;
    }

    if (dto.featured !== undefined) {
      marketplace.featured = dto.featured;
    }

    if (dto.priceCredits !== undefined) {
      marketplace.priceCredits = dto.priceCredits;
    }

    if (dto.adminNote !== undefined) {
      marketplace.adminNote = dto.adminNote;
    }

    marketplace.reviewedAt = new Date().toISOString();
    template.content = {
      ...content,
      marketplace,
    };

    return this.getTemplateRepo().save(template);
  }

  async updateTemplate(
    templateId: string,
    dto: UpdateAdminTemplateDto,
    actor?: AdminAuditActor,
  ) {
    const templateRepo = this.getTemplateRepo();
    const template = await templateRepo.findOne({
      where: { id: templateId },
      relations: ['author'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const before = {
      visibility: template.visibility,
      marketplace: this.templateMarketplace(template),
    };

    const saved = await this.updateTemplateInternal(template, dto);

    if (actor) {
      await this.log(actor, {
        action: 'admin.template.update',
        entityType: 'template',
        entityId: saved.id,
        entityName: saved.title,
        before,
        after: {
          visibility: saved.visibility,
          marketplace: this.templateMarketplace(saved),
        },
        meta: dto as Record<string, unknown>,
      });
    }

    if (saved.author?.id) {
      await this.notificationsService.notifyUser({
        userId: saved.author.id,
        category: NotificationCategory.MODERATION,
        type: NotificationType.INFO,
        title: 'Template moderation updated',
        message: `Your template "${saved.title}" was reviewed by the admin team.`,
        emailSubject: `Template reviewed: ${saved.title}`,
      });
    }

    await this.notificationsService.notifyAdminUsers({
      category: NotificationCategory.MODERATION,
      type: NotificationType.INFO,
      title: 'Template moderation review',
      message: `Template "${saved.title}" was reviewed${actor?.email ? ` by ${actor.email}` : ''}.`,
      emailSubject: `Moderation review: ${saved.title}`,
    });

    return templateRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async bulkUpdateTemplates(dto: AdminTemplateBulkPayload, actor: AdminAuditActor) {
    if (!dto.delete && !dto.visibility && dto.listed === undefined && dto.featured === undefined && dto.priceCredits === undefined && dto.adminNote === undefined) {
      throw new BadRequestException('Provide at least one moderation field for bulk update');
    }

    const templateRepo = this.getTemplateRepo();
    const templates = await templateRepo.find({
      where: { id: In(dto.ids) },
      relations: ['author'],
    });

    if (templates.length === 0) {
      throw new NotFoundException('No matching templates found');
    }

    if (dto.delete) {
      await templateRepo.softDelete(dto.ids);
      await this.log(actor, {
        action: 'admin.templates.bulk_delete',
        entityType: 'template',
        meta: { ids: dto.ids, count: templates.length },
      });
      await this.notifyTemplateAuthors(templates, {
        title: 'Template moderation action',
        message: (count, titles) =>
          count === 1
            ? `Your template "${titles[0]}" was removed by an admin moderation action.`
            : `Your ${count} templates were removed by an admin moderation action.`,
        type: NotificationType.WARNING,
        emailSubject: (count) =>
          count === 1 ? 'Template removed' : 'Templates removed',
      });
      await this.notificationsService.notifyAdminUsers({
        category: NotificationCategory.MODERATION,
        type: NotificationType.WARNING,
        title: 'Template moderation bulk delete',
        message: `Bulk delete removed ${templates.length} template${templates.length === 1 ? '' : 's'}.`,
        emailSubject: 'Bulk template deletion',
      });
      return { deleted: templates.length, ids: dto.ids };
    }

    const updated: TemplateEntity[] = [];
    for (const template of templates) {
      updated.push(await this.updateTemplateInternal(template, dto));
    }

    await this.log(actor, {
      action: 'admin.templates.bulk_update',
      entityType: 'template',
      meta: {
        ids: dto.ids,
        count: updated.length,
        visibility: dto.visibility ?? null,
        listed: dto.listed ?? null,
        featured: dto.featured ?? null,
        priceCredits: dto.priceCredits ?? null,
      },
    });

    await this.notifyTemplateAuthors(updated, {
      title: 'Template moderation updated',
      message: (count, titles) =>
        count === 1
          ? `Your template "${titles[0]}" was updated by an admin moderation action.`
          : `Your ${count} templates were updated by an admin moderation action.`,
      type: NotificationType.INFO,
      emailSubject: (count) =>
        count === 1 ? 'Template updated' : 'Templates updated',
    });

    await this.notificationsService.notifyAdminUsers({
      category: NotificationCategory.MODERATION,
      type: NotificationType.INFO,
      title: 'Template moderation bulk update',
      message: `Bulk moderation updated ${updated.length} template${updated.length === 1 ? '' : 's'}.`,
      emailSubject: 'Bulk template update',
    });

    return { updated: updated.length, ids: dto.ids };
  }

  async removeTemplate(templateId: string, actor?: AdminAuditActor) {
    const templateRepo = this.getTemplateRepo();
    const template = await templateRepo.findOne({
      where: { id: templateId },
      relations: ['author'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await templateRepo.softDelete(templateId);

    if (actor) {
      await this.log(actor, {
        action: 'admin.template.delete',
        entityType: 'template',
        entityId: template.id,
        entityName: template.title,
      });
    }

    if (template.author?.id) {
      await this.notificationsService.notifyUser({
        userId: template.author.id,
        category: NotificationCategory.MODERATION,
        type: NotificationType.WARNING,
        title: 'Template removed',
        message: `Your template "${template.title}" was removed by the admin team.`,
        emailSubject: `Template removed: ${template.title}`,
      });
    }

    await this.notificationsService.notifyAdminUsers({
      category: NotificationCategory.MODERATION,
      type: NotificationType.WARNING,
      title: 'Template removed',
      message: `Template "${template.title}" was removed${actor?.email ? ` by ${actor.email}` : ''}.`,
      emailSubject: `Template removed: ${template.title}`,
    });

    return { success: true };
  }

  async getAuditLogs(filters: QueryAdminAuditLogsDto = {}) {
    return this.auditService.list(filters);
  }

  async exportAuditLogs(filters: QueryAdminAuditLogsDto = {}) {
    return this.auditService.exportCsv(filters);
  }

  async importExternalCatalog(dto: ImportExternalCatalogDto, actor?: AdminAuditActor) {
    const options: ExternalCatalogImportOptions = {
      dryRun: dto.dryRun ?? true,
      force: dto.force ?? false,
      sources:
        dto.sources?.length
          ? dto.sources
          : EXTERNAL_CATALOG_SOURCES.map((source) => source.id),
      maxItems: dto.maxItems ?? 10,
    };

    const result = await runExternalCatalogImport(options, this.dataSource);

    if (actor) {
      await this.log(actor, {
        action: dto.dryRun ? 'admin.catalog.import_dry_run' : 'admin.catalog.import',
        entityType: 'catalog',
        meta: {
          sources: options.sources,
          maxItems: options.maxItems,
          dryRun: options.dryRun,
          result,
        },
      });
    }

    return result;
  }

  async exportUsersCsv(filters: QueryAdminUsersDto = {}) {
    return this.exportUsers(filters);
  }

  async exportTemplatesCsv(filters: QueryAdminTemplatesDto = {}) {
    return this.exportTemplates(filters);
  }

  async exportAssetsCsv(filters: QueryAdminAssetsDto = {}) {
    return this.exportAssets(filters);
  }

  async exportOrganizationsCsv(filters: QueryAdminOrganizationsDto = {}) {
    return this.exportOrganizations(filters);
  }

  async getOrganizationMembers(orgId: string) {
    return this.getOrganizationDetail(orgId);
  }

  async updateOrganizationOwner(
    orgId: string,
    memberId: string,
    actor: AdminAuditActor,
  ) {
    return this.transferOrganizationOwnership(orgId, memberId, actor);
  }

  async updateOrganizationMemberRole(
    orgId: string,
    memberId: string,
    dto: UpdateAdminOrganizationMemberDto,
    actor: AdminAuditActor,
  ) {
    return this.updateOrganizationMember(orgId, memberId, dto, actor);
  }

  async removeOrganizationMember(
    orgId: string,
    memberId: string,
    actor: AdminAuditActor,
  ) {
    return this.deleteOrganizationMemberInternal(orgId, memberId, actor);
  }
}
