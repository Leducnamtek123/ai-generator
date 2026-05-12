import { AdminCatalogService } from './admin-catalog.service';
import { runExternalCatalogImport } from '../database/seeds/external-catalog/run-external-catalog-import';
import { AdminAuditLogEntity } from './entities/admin-audit-log.entity';

jest.mock('../database/seeds/external-catalog/run-external-catalog-import', () => ({
  runExternalCatalogImport: jest.fn(),
}));

describe('AdminCatalogService', () => {
  const auditLogs = [
    {
      id: 'audit-1',
      actorId: 1,
      actorEmail: 'admin@example.com',
      action: 'admin.template.update',
      entityType: 'template',
      entityId: 'tpl-1',
      entityName: 'Template One',
      success: true,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    },
    {
      id: 'audit-2',
      actorId: 1,
      actorEmail: 'admin@example.com',
      action: 'admin.user.update',
      entityType: 'user',
      entityId: 'user-1',
      entityName: 'User One',
      success: false,
      error: 'failed',
      createdAt: new Date('2026-05-02T00:00:00.000Z'),
    },
  ] as any[];

  const dataSource = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === AdminAuditLogEntity) {
        return {
          count: jest.fn().mockResolvedValue(auditLogs.length),
          createQueryBuilder: jest.fn(() => ({
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(auditLogs),
          })),
        };
      }

      return {
        count: jest.fn().mockResolvedValue(0),
      };
    }),
  } as any;
  const auditService = {
    record: jest.fn(),
    list: jest.fn(),
    exportCsv: jest.fn(),
  } as any;
  const notificationsService = {
    notifyUser: jest.fn(),
  } as any;

  const service = new AdminCatalogService(
    dataSource,
    auditService,
    notificationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes catalog import controls through to the importer and audit log', async () => {
    (runExternalCatalogImport as jest.Mock).mockResolvedValueOnce({
      dryRun: false,
      results: [],
    });

    await expect(
      service.importExternalCatalog(
        {
          dryRun: false,
          force: true,
          sources: ['prompt-library'],
          maxItems: 7,
        },
        {
          id: 1,
          email: 'admin@example.com',
          role: 'admin',
        },
      ),
    ).resolves.toEqual(expect.objectContaining({ dryRun: false, results: [] }));

    expect(runExternalCatalogImport).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: false,
        force: true,
        sources: ['prompt-library'],
        maxItems: 7,
      }),
      dataSource,
    );

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.catalog.import',
        entityType: 'catalog',
        meta: expect.objectContaining({
          dryRun: false,
          force: true,
          maxItems: 7,
          sources: ['prompt-library'],
        }),
      }),
    );
  });

  it('filters admin notifications by severity, category, and search', async () => {
    await expect(
      service.getNotifications({
        q: 'failed',
        severity: 'critical',
        category: 'security',
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          total: 1,
          critical: 1,
          unresolved: 1,
        }),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'audit-failure:audit-2',
            severity: 'critical',
            category: 'security',
            title: 'User updated failed',
          }),
        ]),
      }),
    );
  });
});
