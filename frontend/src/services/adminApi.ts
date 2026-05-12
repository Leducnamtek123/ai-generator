import { api, del, get, patch, post } from '@/lib/api';

type AdminCatalogSource = {
  id: string;
  name: string;
  url: string;
  kind: string;
  visibility: string;
  defaultType?: string;
  defaultPriceCredits: number;
  maxItems: number;
  featuredCount: number;
  tags: string[];
  sourceLicense?: string;
};

type AdminCatalogImportRequest = {
  dryRun?: boolean;
  force?: boolean;
  sources?: string[];
  maxItems?: number;
};

export type AdminCatalogImportResult = {
  dryRun: boolean;
  results: Array<{
    sourceId: string;
    sourceName: string;
    discovered: number;
    inserted: number;
    skipped: number;
    samples: string[];
  }>;
};

type AdminOverview = {
  users: number;
  templates: number;
  assets: number;
  workspaces: number;
  publicTemplates: number;
  communityTemplates: number;
  inactiveUsers: number;
  auditLogs: number;
  sources: number;
};

type AdminRolesMatrix = {
  platformRoles: Array<{
    id: number;
    name: string;
    canAccessAdmin: boolean;
    canManageUsers: boolean;
    canManageTemplates: boolean;
    canManageAssets: boolean;
    canManageWorkspaces: boolean;
    canViewAuditLogs: boolean;
  }>;
  userStatuses: Array<{ id: number; name: string }>;
  workspaceRoles: Array<{
    id: string;
    name: string;
    canManageMembers: boolean;
    canTransferOwnership: boolean;
    canBill: boolean;
  }>;
  templateVisibility: string[];
  moderationActions: string[];
};

type AdminRole = {
  id?: string | number | null;
  name?: string | null;
};

type AdminStatus = {
  id?: string | number | null;
  name?: string | null;
};

export type AdminUser = {
  id: number;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: AdminRole | null;
  status?: AdminStatus | null;
  createdAt?: string;
};

type AdminWorkspaceMember = {
  id: string;
  userId: number;
  workspaceId: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

export type AdminWorkspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: number;
  domain?: string | null;
  url?: string | null;
  description?: string | null;
  shouldAttachUsersByDomain?: boolean;
  avatarUrl?: string | null;
  memberCount: number;
  createdAt?: string;
};

type AdminWorkspaceDetail = AdminWorkspace & {
  members: AdminWorkspaceMember[];
};

export type AdminAsset = {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  userId: string;
  projectId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type AdminAuditLog = {
  id: string;
  actorId: number;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  success: boolean;
  error?: string | null;
  createdAt: string;
};

export type AdminQueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  'waiting-children': number;
};

export type AdminQueueSnapshot = {
  queue: string;
  counts: AdminQueueCounts;
};

export type AdminQueueSnapshotResponse = {
  timestamp: string;
  queues: AdminQueueSnapshot[];
};

export type AdminDeadLetterJob = {
  id: string | number;
  sourceQueue: string;
  jobId?: string | number | null;
  jobName: string;
  attemptsMade: number;
  errorMessage: string;
  failedAt: string;
};

export type AdminTemplate = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  visibility: string;
  usageCount?: number;
  createdAt?: string;
  content?: {
    marketplace?: {
      listed?: boolean;
      featured?: boolean;
      priceCredits?: number;
      adminNote?: string;
      reviewedAt?: string;
    };
    importedFrom?: {
      sourceName?: string;
      sourceId?: string;
      importedAt?: string;
    };
  };
  author?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
};

type AdminPageResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

export type UpdateAdminUserRequest = {
  roleId?: 1 | 2;
  statusId?: 1 | 2;
};

type BulkUpdateAdminUsersRequest = UpdateAdminUserRequest & {
  ids: number[];
};

export type UpdateAdminTemplateRequest = {
  visibility?: 'public' | 'community' | 'private';
  listed?: boolean;
  featured?: boolean;
  priceCredits?: number;
  adminNote?: string;
};

type BulkUpdateAdminTemplatesRequest = UpdateAdminTemplateRequest & {
  ids: string[];
  delete?: boolean;
};

type BulkDeleteAdminAssetsRequest = {
  ids: string[];
};

export type UpdateAdminWorkspaceRequest = {
  name?: string;
  slug?: string;
  url?: string;
  description?: string;
  domain?: string | null;
  shouldAttachUsersByDomain?: boolean;
  avatarUrl?: string;
  ownerId?: number;
};

type UpdateAdminWorkspaceMemberRequest = {
  role?: string;
};

type TransferAdminWorkspaceOwnerRequest = {
  memberId: string;
};

type AdminUsersQuery = {
  page?: number;
  limit?: number;
  q?: string;
  roleId?: number;
  statusId?: number;
};

type AdminTemplatesQuery = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  visibility?: string;
  listed?: boolean;
  featured?: boolean;
  authorId?: string;
};

type AdminAssetsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  userId?: string;
  projectId?: string;
};

type AdminWorkspacesQuery = {
  page?: number;
  limit?: number;
  q?: string;
  slug?: string;
  domain?: string;
  ownerId?: number;
};

type AdminAuditLogsQuery = {
  page?: number;
  limit?: number;
  q?: string;
  action?: string;
  entityType?: string;
  actorId?: number;
  from?: string;
  to?: string;
};

export type SiteConfigEntry = {
  id: string;
  key: string;
  locale: string;
  value: Record<string, unknown>;
  description?: string | null;
  updatedById?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type SiteConfigQuery = {
  key?: string;
  locale?: string;
};

type UpsertSiteConfigRequest = {
  locale?: string;
  value: Record<string, unknown>;
  description?: string;
};

const buildQuery = (params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') {
      query.set(key, String(value));
      return;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) {
        query.set(key, value.join(','));
      }
      return;
    }
    query.set(key, String(value));
  });

  return query.toString();
};

export const adminApi = {
  getOverview: () => get<AdminOverview>('/admin/overview'),
  getRolesMatrix: () => get<AdminRolesMatrix>('/admin/roles/matrix'),
  getUsers: (query: AdminUsersQuery = {}) =>
    get<AdminPageResponse<AdminUser>>(`/admin/users?${buildQuery(query)}`),
  exportUsers: (query: AdminUsersQuery = {}) =>
    api.get<string>(`/admin/users/export?${buildQuery(query)}`, {
      responseType: 'text',
    }),
  updateUser: (id: number, payload: UpdateAdminUserRequest) =>
    patch<AdminUser, UpdateAdminUserRequest>(`/admin/users/${id}`, payload),
  bulkUpdateUsers: (payload: BulkUpdateAdminUsersRequest) =>
    post<{ updated: number; ids: number[] }, BulkUpdateAdminUsersRequest>(
      '/admin/users/bulk',
      payload,
    ),
  getWorkspaces: (query: AdminWorkspacesQuery = {}) =>
    get<AdminPageResponse<AdminWorkspace>>(`/admin/workspaces?${buildQuery(query)}`),
  exportWorkspaces: (query: AdminWorkspacesQuery = {}) =>
    api.get<string>(`/admin/workspaces/export?${buildQuery(query)}`, {
      responseType: 'text',
    }),
  getWorkspace: (id: string) => get<AdminWorkspaceDetail>(`/admin/workspaces/${id}`),
  updateWorkspace: (id: string, payload: UpdateAdminWorkspaceRequest) =>
    patch<AdminWorkspace, UpdateAdminWorkspaceRequest>(
      `/admin/workspaces/${id}`,
      payload,
    ),
  transferWorkspaceOwner: (id: string, payload: TransferAdminWorkspaceOwnerRequest) =>
    post<AdminWorkspaceDetail, TransferAdminWorkspaceOwnerRequest>(
      `/admin/workspaces/${id}/transfer-owner`,
      payload,
    ),
  getWorkspaceMembers: (id: string) =>
    get<AdminWorkspaceDetail>(`/admin/workspaces/${id}/members`),
  updateWorkspaceMember: (
    id: string,
    memberId: string,
    payload: UpdateAdminWorkspaceMemberRequest,
  ) =>
    patch(`/admin/workspaces/${id}/members/${memberId}`, payload),
  deleteWorkspaceMember: (id: string, memberId: string) =>
    del<void>(`/admin/workspaces/${id}/members/${memberId}`),
  getAssets: (query: AdminAssetsQuery = {}) =>
    get<AdminPageResponse<AdminAsset>>(`/admin/assets?${buildQuery(query)}`),
  exportAssets: (query: AdminAssetsQuery = {}) =>
    api.get<string>(`/admin/assets/export?${buildQuery(query)}`, {
      responseType: 'text',
    }),
  bulkDeleteAssets: (payload: BulkDeleteAdminAssetsRequest) =>
    post<{ deleted: number; ids: string[] }, BulkDeleteAdminAssetsRequest>(
      '/admin/assets/bulk-delete',
      payload,
    ),
  deleteAsset: (id: string) => del<void>(`/admin/assets/${id}`),
  getTemplates: (query: AdminTemplatesQuery = {}) =>
    get<AdminPageResponse<AdminTemplate>>(`/admin/templates?${buildQuery(query)}`),
  exportTemplates: (query: AdminTemplatesQuery = {}) =>
    api.get<string>(`/admin/templates/export?${buildQuery(query)}`, {
      responseType: 'text',
    }),
  updateTemplate: (id: string, payload: UpdateAdminTemplateRequest) =>
    patch<AdminTemplate, UpdateAdminTemplateRequest>(`/admin/templates/${id}`, payload),
  bulkUpdateTemplates: (payload: BulkUpdateAdminTemplatesRequest) =>
    post<{ updated?: number; deleted?: number; ids: string[] }, BulkUpdateAdminTemplatesRequest>(
      '/admin/templates/bulk',
      payload,
    ),
  deleteTemplate: (id: string) => del<void>(`/admin/templates/${id}`),
  getAuditLogs: (query: AdminAuditLogsQuery = {}) =>
    get<AdminPageResponse<AdminAuditLog>>(`/admin/audit-logs?${buildQuery(query)}`),
  exportAuditLogs: (query: AdminAuditLogsQuery = {}) =>
    api.get<string>(`/admin/audit-logs/export?${buildQuery(query)}`, {
      responseType: 'text',
    }),
  getQueues: () => get<AdminQueueSnapshotResponse>('/admin/queues'),
  getDeadLetterJobs: () => get<AdminDeadLetterJob[]>('/admin/queues/dead-letter'),
  requeueDeadLetterJob: (jobId: string) =>
    post<{ recovered: boolean; deadLetterJobId: string; sourceQueue: string; sourceJobId: string; recoveredAt: string }, void>(
      `/admin/queues/dead-letter/${jobId}/requeue`,
    ),
  getCatalogSources: () => get<AdminCatalogSource[]>('/admin/catalog/sources'),
  importCatalog: (payload: AdminCatalogImportRequest) =>
    post<AdminCatalogImportResult, AdminCatalogImportRequest>(
      '/admin/catalog/import',
      payload,
    ),
  getSiteConfigs: (query: SiteConfigQuery = {}) =>
    get<SiteConfigEntry[]>(`/admin/site-configs?${buildQuery(query)}`),
  upsertSiteConfig: (key: string, payload: UpsertSiteConfigRequest) =>
    patch<SiteConfigEntry, UpsertSiteConfigRequest>(`/admin/site-configs/${key}`, payload),
};
