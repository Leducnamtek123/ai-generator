import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';

export type AdminAuditActor = {
  id: number;
  email?: string | null;
  role?: string | number | null;
};

export type AdminAuditInput = {
  actor: AdminAuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  success?: boolean;
  error?: string | null;
};

const safeLimit = (limit = 20) => Math.min(Math.max(limit, 1), 100);
const safePage = (page = 1) => Math.max(page, 1);

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly dataSource: DataSource) {}

  async record(input: AdminAuditInput) {
    const repository = this.dataSource.getRepository(AdminAuditLogEntity);
    await repository.save(
      repository.create({
        actorId: input.actor.id,
        actorEmail: input.actor.email ?? null,
        actorRole:
          typeof input.actor.role === 'string'
            ? input.actor.role
            : input.actor.role !== null && input.actor.role !== undefined
              ? String(input.actor.role)
              : null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        entityName: input.entityName ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        meta: input.meta ?? null,
        success: input.success ?? true,
        error: input.error ?? null,
      }),
    );
  }

  private buildQuery(filters: QueryAdminAuditLogsDto = {}) {
    const repository = this.dataSource.getRepository(AdminAuditLogEntity);
    const qb = repository.createQueryBuilder('audit').orderBy('audit.createdAt', 'DESC');

    if (filters.action?.trim()) {
      qb.andWhere('audit.action ILIKE :action', { action: `%${filters.action.trim()}%` });
    }

    if (filters.entityType?.trim()) {
      qb.andWhere('audit.entityType ILIKE :entityType', {
        entityType: `%${filters.entityType.trim()}%`,
      });
    }

    if (filters.actorId) {
      qb.andWhere('audit.actorId = :actorId', { actorId: filters.actorId });
    }

    if (filters.from) {
      qb.andWhere('audit.createdAt >= :from', { from: filters.from });
    }

    if (filters.to) {
      qb.andWhere('audit.createdAt <= :to', { to: filters.to });
    }

    if (filters.q?.trim()) {
      const query = `%${filters.q.trim()}%`;
      qb.andWhere(
        '(audit.actorEmail ILIKE :query OR audit.action ILIKE :query OR audit.entityType ILIKE :query OR COALESCE(audit.entityName, \'\') ILIKE :query OR COALESCE(audit.entityId, \'\') ILIKE :query)',
        { query },
      );
    }

    return qb;
  }

  async list(filters: QueryAdminAuditLogsDto = {}) {
    const page = safePage(filters.page);
    const limit = safeLimit(filters.limit);
    const qb = this.buildQuery(filters).skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    };
  }

  async exportCsv(filters: QueryAdminAuditLogsDto = {}) {
    const data = await this.buildQuery(filters).getMany();
    const headers = [
      'createdAt',
      'actorId',
      'actorEmail',
      'actorRole',
      'action',
      'entityType',
      'entityId',
      'entityName',
      'success',
      'error',
      'meta',
    ];
    const rows = data.map((item) => [
      item.createdAt.toISOString(),
      item.actorId,
      item.actorEmail ?? '',
      item.actorRole ?? '',
      item.action,
      item.entityType,
      item.entityId ?? '',
      item.entityName ?? '',
      item.success ? 'true' : 'false',
      item.error ?? '',
      item.meta ? JSON.stringify(item.meta) : '',
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
  }
}
