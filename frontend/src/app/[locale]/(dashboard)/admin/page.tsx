'use client';

import React from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Activity,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileText,
  Filter,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/ui/skeleton';
import { useAuth } from '@/providers';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { canAccessAdmin } from '@/lib/access-control';
import { AdminNotificationsPanel } from '@/components/admin/AdminNotificationsPanel';
import {
  adminApi,
  type AdminAsset,
  type AdminDeadLetterJob,
  type AdminAuditLog,
  type AdminCatalogImportResult,
  type AdminWorkspace,
  type AdminTemplate,
  type AdminUser,
  type UpdateAdminWorkspaceRequest,
} from '@/services/adminApi';

type AdminSection =
  | 'overview'
  | 'ops'
  | 'notifications'
  | 'users'
  | 'workspaces'
  | 'templates'
  | 'assets'
  | 'audit'
  | 'catalog'
  | 'content'
  | 'roles';

const sections: Array<{ id: AdminSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ops', label: 'Ops' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'users', label: 'Users' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'templates', label: 'Templates' },
  { id: 'assets', label: 'Assets' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'catalog', label: 'Catalog Import' },
  { id: 'content', label: 'Content Config' },
  { id: 'roles', label: 'Role Matrix' },
];

type AdminState = {
  activeSection: AdminSection;
  userPage: number;
  userSearch: string;
  userRole: string;
  userStatus: string;
  selectedUserIds: number[];
  templatePage: number;
  templateSearch: string;
  templateVisibility: string;
  templateType: string;
  templateListed: string;
  templateFeatured: string;
  selectedTemplateIds: string[];
  bulkTemplatePrice: string;
  bulkTemplateVisibility: string;
  assetPage: number;
  assetSearch: string;
  assetType: string;
  selectedAssetIds: string[];
  workspacePage: number;
  workspaceSearch: string;
  selectedWorkspaceId: string | null;
  workspaceName: string;
  workspaceSlug: string;
  workspaceUrl: string;
  workspaceDescription: string;
  workspaceDomain: string;
  workspaceAttachByDomain: boolean;
  workspaceAvatarUrl: string;
  workspaceOwnerId: string;
  workspaceMemberSearch: string;
  workspaceMemberRoleFilter: string;
  selectedWorkspaceMemberIds: string[];
  auditPage: number;
  auditSearch: string;
  auditAction: string;
  auditEntityType: string;
  auditActorId: string;
  auditFrom: string;
  auditTo: string;
  siteConfigKey: string;
  siteConfigLocale: string;
  siteConfigDraft: string;
  catalogSelectedSourceIds: string[];
  catalogSourcesInitialized: boolean;
  catalogMaxItems: string;
  catalogForce: boolean;
};

type AdminStateAction =
  | { type: 'setField'; key: keyof AdminState; value: AdminState[keyof AdminState] }
  | {
      type: 'setWorkspaceDetail';
      payload: Pick<
        AdminState,
        | 'workspaceName'
        | 'workspaceSlug'
        | 'workspaceUrl'
        | 'workspaceDescription'
        | 'workspaceDomain'
        | 'workspaceAttachByDomain'
        | 'workspaceAvatarUrl'
        | 'workspaceOwnerId'
      >;
    };

const initialAdminState: AdminState = {
  activeSection: 'overview',
  userPage: 1,
  userSearch: '',
  userRole: '',
  userStatus: '',
  selectedUserIds: [],
  templatePage: 1,
  templateSearch: '',
  templateVisibility: '',
  templateType: '',
  templateListed: '',
  templateFeatured: '',
  selectedTemplateIds: [],
  bulkTemplatePrice: '',
  bulkTemplateVisibility: '',
  assetPage: 1,
  assetSearch: '',
  assetType: '',
  selectedAssetIds: [],
  workspacePage: 1,
  workspaceSearch: '',
  selectedWorkspaceId: null,
  workspaceName: '',
  workspaceSlug: '',
  workspaceUrl: '',
  workspaceDescription: '',
  workspaceDomain: '',
  workspaceAttachByDomain: false,
  workspaceAvatarUrl: '',
  workspaceOwnerId: '',
  workspaceMemberSearch: '',
  workspaceMemberRoleFilter: '',
  selectedWorkspaceMemberIds: [],
  auditPage: 1,
  auditSearch: '',
  auditAction: '',
  auditEntityType: '',
  auditActorId: '',
  auditFrom: '',
  auditTo: '',
  siteConfigKey: 'landing',
  siteConfigLocale: 'en',
  siteConfigDraft: '',
  catalogSelectedSourceIds: [],
  catalogSourcesInitialized: false,
  catalogMaxItems: '10',
  catalogForce: false,
};

function adminReducer(state: AdminState, action: AdminStateAction): AdminState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.key]: action.value };
    case 'setWorkspaceDetail':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const parseErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string; errors?: Record<string, unknown> }
      | undefined;

    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message) && data.message.length > 0) return data.message.join(', ');
    if (typeof data?.error === 'string') return data.error;
    if (data?.errors) {
      const flattened: string[] = [];
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && item.trim().length > 0) {
              flattened.push(item);
            }
          }
          continue;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
          flattened.push(value);
        }
      }
      if (flattened.length > 0) return flattened.join(', ');
    }
    return error.message || fallback;
  }

  if (error instanceof Error) return error.message || fallback;
  return fallback;
};

function ClientDateTime({ value }: { value: string | number | Date }) {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    setText(new Date(value).toLocaleString());
  }, [value]);

  return <div>{text}</div>;
}

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const formatPerson = (user?: { email?: string | null; firstName?: string | null; lastName?: string | null }) => {
  if (!user) return 'Unknown user';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email || 'Unknown user';
};

const CsvButton = ({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => Promise<void> | void;
  busy?: boolean;
}) => (
  <Button variant="outline" size="sm" onClick={() => void onClick()} disabled={busy}>
    <Download className="mr-2 size-4" />
    {label}
  </Button>
);

const BulkBar = ({
  count,
  actions,
}: {
  count: number;
  actions: React.ReactNode;
}) => {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <span className="font-medium">{count} selected</span>
      {actions}
    </div>
  );
};

const PaginationControls = ({
  page,
  hasNextPage,
  onPrev,
  onNext,
}: {
  page: number;
  hasNextPage: boolean;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
    <span>Page {page}</span>
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onPrev} disabled={page === 1}>
        Previous
      </Button>
      <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNextPage}>
        Next
      </Button>
    </div>
  </div>
);

export default function AdminPage() {
  const { push } = useRouter();
  const { user, isLoading } = useAuth();
  const isAdmin = canAccessAdmin(user);
  const [state, dispatch] = React.useReducer(adminReducer, initialAdminState);
  const [expandedAuditLogIds, setExpandedAuditLogIds] = React.useState<string[]>([]);
  const {
    activeSection,
    userPage,
    userSearch,
    userRole,
    userStatus,
    selectedUserIds,
    templatePage,
    templateSearch,
    templateVisibility,
    templateType,
    templateListed,
    templateFeatured,
    selectedTemplateIds,
    bulkTemplatePrice,
    bulkTemplateVisibility,
    assetPage,
    assetSearch,
    assetType,
    selectedAssetIds,
    workspacePage,
    workspaceSearch,
    selectedWorkspaceId,
    workspaceName,
    workspaceSlug,
    workspaceUrl,
    workspaceDescription,
    workspaceDomain,
    workspaceAttachByDomain,
    workspaceAvatarUrl,
    workspaceOwnerId,
    workspaceMemberSearch,
    workspaceMemberRoleFilter,
    selectedWorkspaceMemberIds,
    auditPage,
    auditSearch,
    auditAction,
    auditEntityType,
    auditActorId,
    auditFrom,
    auditTo,
    siteConfigKey,
    siteConfigLocale,
    siteConfigDraft,
    catalogSelectedSourceIds,
    catalogSourcesInitialized,
    catalogMaxItems,
    catalogForce,
  } = state;

  type SetStateAction<T> = T | ((prev: T) => T);
  const setField = <K extends keyof AdminState>(key: K, next: SetStateAction<AdminState[K]>) => {
    const value = typeof next === 'function' ? (next as (prev: AdminState[K]) => AdminState[K])(state[key]) : next;
    dispatch({ type: 'setField', key, value: value as AdminState[K] });
  };
  const setActiveSection = (next: SetStateAction<AdminSection>) => setField('activeSection', next);
  const setUserPage = (next: SetStateAction<number>) => setField('userPage', next);
  const setUserSearch = (next: SetStateAction<string>) => setField('userSearch', next);
  const setUserRole = (next: SetStateAction<string>) => setField('userRole', next);
  const setUserStatus = (next: SetStateAction<string>) => setField('userStatus', next);
  const setSelectedUserIds = (next: SetStateAction<number[]>) => setField('selectedUserIds', next);
  const setTemplatePage = (next: SetStateAction<number>) => setField('templatePage', next);
  const setTemplateSearch = (next: SetStateAction<string>) => setField('templateSearch', next);
  const setTemplateVisibility = (next: SetStateAction<string>) => setField('templateVisibility', next);
  const setTemplateType = (next: SetStateAction<string>) => setField('templateType', next);
  const setTemplateListed = (next: SetStateAction<string>) => setField('templateListed', next);
  const setTemplateFeatured = (next: SetStateAction<string>) => setField('templateFeatured', next);
  const setSelectedTemplateIds = (next: SetStateAction<string[]>) => setField('selectedTemplateIds', next);
  const setBulkTemplatePrice = (next: SetStateAction<string>) => setField('bulkTemplatePrice', next);
  const setBulkTemplateVisibility = (next: SetStateAction<string>) => setField('bulkTemplateVisibility', next);
  const setAssetPage = (next: SetStateAction<number>) => setField('assetPage', next);
  const setAssetSearch = (next: SetStateAction<string>) => setField('assetSearch', next);
  const setAssetType = (next: SetStateAction<string>) => setField('assetType', next);
  const setSelectedAssetIds = (next: SetStateAction<string[]>) => setField('selectedAssetIds', next);
  const setWorkspacePage = (next: SetStateAction<number>) => setField('workspacePage', next);
  const setWorkspaceSearch = (next: SetStateAction<string>) => setField('workspaceSearch', next);
  const setSelectedWorkspaceId = (next: SetStateAction<string | null>) => setField('selectedWorkspaceId', next);
  const setWorkspaceName = (next: SetStateAction<string>) => setField('workspaceName', next);
  const setWorkspaceSlug = (next: SetStateAction<string>) => setField('workspaceSlug', next);
  const setWorkspaceUrl = (next: SetStateAction<string>) => setField('workspaceUrl', next);
  const setWorkspaceDescription = (next: SetStateAction<string>) => setField('workspaceDescription', next);
  const setWorkspaceDomain = (next: SetStateAction<string>) => setField('workspaceDomain', next);
  const setWorkspaceAttachByDomain = (next: SetStateAction<boolean>) => setField('workspaceAttachByDomain', next);
  const setWorkspaceAvatarUrl = (next: SetStateAction<string>) => setField('workspaceAvatarUrl', next);
  const setWorkspaceOwnerId = (next: SetStateAction<string>) => setField('workspaceOwnerId', next);
  const setWorkspaceMemberSearch = (next: SetStateAction<string>) => setField('workspaceMemberSearch', next);
  const setWorkspaceMemberRoleFilter = (next: SetStateAction<string>) => setField('workspaceMemberRoleFilter', next);
  const setSelectedWorkspaceMemberIds = (next: SetStateAction<string[]>) =>
    setField('selectedWorkspaceMemberIds', next);
  const setAuditPage = (next: SetStateAction<number>) => setField('auditPage', next);
  const setAuditSearch = (next: SetStateAction<string>) => setField('auditSearch', next);
  const setAuditAction = (next: SetStateAction<string>) => setField('auditAction', next);
  const setAuditEntityType = (next: SetStateAction<string>) => setField('auditEntityType', next);
  const setAuditActorId = (next: SetStateAction<string>) => setField('auditActorId', next);
  const setAuditFrom = (next: SetStateAction<string>) => setField('auditFrom', next);
  const setAuditTo = (next: SetStateAction<string>) => setField('auditTo', next);
  const setSiteConfigKey = (next: SetStateAction<string>) => setField('siteConfigKey', next);
  const setSiteConfigLocale = (next: SetStateAction<string>) => setField('siteConfigLocale', next);
  const setSiteConfigDraft = (next: SetStateAction<string>) => setField('siteConfigDraft', next);
  const setCatalogSelectedSourceIds = (next: SetStateAction<string[]>) =>
    setField('catalogSelectedSourceIds', next);
  const setCatalogSourcesInitialized = (next: SetStateAction<boolean>) =>
    setField('catalogSourcesInitialized', next);
  const setCatalogMaxItems = (next: SetStateAction<string>) => setField('catalogMaxItems', next);
  const setCatalogForce = (next: SetStateAction<boolean>) => setField('catalogForce', next);

  const qc = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.getOverview,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const rolesMatrixQuery = useQuery({
    queryKey: ['admin', 'roles-matrix'],
    queryFn: adminApi.getRolesMatrix,
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  });

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', userPage, userSearch, userRole, userStatus],
    queryFn: () =>
      adminApi.getUsers({
        page: userPage,
        limit: 10,
        q: userSearch || undefined,
        roleId: userRole ? Number(userRole) : undefined,
        statusId: userStatus ? Number(userStatus) : undefined,
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const templatesQuery = useQuery({
    queryKey: [
      'admin',
      'templates',
      templatePage,
      templateSearch,
      templateVisibility,
      templateType,
      templateListed,
      templateFeatured,
    ],
    queryFn: () =>
      adminApi.getTemplates({
        page: templatePage,
        limit: 10,
        q: templateSearch || undefined,
        visibility: templateVisibility || undefined,
        type: templateType || undefined,
        listed:
          templateListed === '' ? undefined : templateListed === 'true',
        featured:
          templateFeatured === '' ? undefined : templateFeatured === 'true',
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const assetsQuery = useQuery({
    queryKey: ['admin', 'assets', assetPage, assetSearch, assetType],
    queryFn: () =>
      adminApi.getAssets({
        page: assetPage,
        limit: 10,
        q: assetSearch || undefined,
        type: assetType || undefined,
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const workspacesQuery = useQuery({
    queryKey: ['admin', 'workspaces', workspacePage, workspaceSearch],
    queryFn: () =>
      adminApi.getWorkspaces({
        page: workspacePage,
        limit: 10,
        q: workspaceSearch || undefined,
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const workspaceDetailQuery = useQuery({
    queryKey: ['admin', 'workspace', selectedWorkspaceId],
    queryFn: () => adminApi.getWorkspace(selectedWorkspaceId as string),
    enabled: isAdmin && Boolean(selectedWorkspaceId),
  });

  const auditLogsQuery = useQuery({
    queryKey: ['admin', 'audit-logs', auditPage, auditSearch, auditAction, auditEntityType, auditActorId, auditFrom, auditTo],
    queryFn: () =>
      adminApi.getAuditLogs({
        page: auditPage,
        limit: 10,
        q: auditSearch || undefined,
        action: auditAction || undefined,
        entityType: auditEntityType || undefined,
        actorId: auditActorIdValue,
        from: auditFrom || undefined,
        to: auditTo || undefined,
      }),
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const queueSnapshotQuery = useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: adminApi.getQueues,
    enabled: isAdmin,
    staleTime: 15_000,
  });

  const deadLetterJobsQuery = useQuery({
    queryKey: ['admin', 'dead-letter'],
    queryFn: adminApi.getDeadLetterJobs,
    enabled: isAdmin,
    staleTime: 15_000,
  });

  React.useEffect(() => {
    if (!selectedWorkspaceId && workspacesQuery.data?.data?.length) {
      setSelectedWorkspaceId(workspacesQuery.data.data[0].id);
    }
  }, [workspacesQuery.data, selectedWorkspaceId]);

  React.useEffect(() => {
    if (!workspaceDetailQuery.data) return;
    setSelectedWorkspaceMemberIds([]);
    setWorkspaceMemberSearch('');
    setWorkspaceMemberRoleFilter('');
    dispatch({
      type: 'setWorkspaceDetail',
      payload: {
        workspaceName: workspaceDetailQuery.data.name ?? '',
        workspaceSlug: workspaceDetailQuery.data.slug ?? '',
        workspaceUrl: workspaceDetailQuery.data.url ?? '',
        workspaceDescription: workspaceDetailQuery.data.description ?? '',
        workspaceDomain: workspaceDetailQuery.data.domain ?? '',
        workspaceAttachByDomain: Boolean(workspaceDetailQuery.data.shouldAttachUsersByDomain),
        workspaceAvatarUrl: workspaceDetailQuery.data.avatarUrl ?? '',
        workspaceOwnerId: String(workspaceDetailQuery.data.ownerId ?? ''),
      },
    });
  }, [workspaceDetailQuery.data]);

  const handleError = (error: unknown, fallback: string) =>
    toast.error(parseErrorMessage(error, fallback));

  const parsedAuditActorId = Number(auditActorId);
  const auditActorIdValue = Number.isFinite(parsedAuditActorId) ? parsedAuditActorId : undefined;
  const isAuditLogExpanded = React.useCallback(
    (id: string) => expandedAuditLogIds.includes(id),
    [expandedAuditLogIds],
  );
  const toggleAuditLogExpanded = React.useCallback((id: string) => {
    setExpandedAuditLogIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ['admin'] });
  };

  const saveSiteConfig = () => {
    try {
      const parsed = JSON.parse(siteConfigDraft) as Record<string, unknown>;
      updateSiteConfigMutation.mutate({
        key: siteConfigKey,
        payload: {
          locale: siteConfigLocale,
          value: parsed,
        },
      });
    } catch {
      toast.error('Site config JSON is invalid');
    }
  };

  const sourcesQuery = useQuery({
    queryKey: ['admin', 'catalog-sources'],
    queryFn: adminApi.getCatalogSources,
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  });

  React.useEffect(() => {
    if (catalogSourcesInitialized) return;
    const sourceIds = sourcesQuery.data?.map((source) => source.id) ?? [];
    if (sourceIds.length === 0) return;
    setCatalogSelectedSourceIds(sourceIds);
    setCatalogSourcesInitialized(true);
  }, [catalogSourcesInitialized, sourcesQuery.data]);

  const siteConfigsQuery = useQuery({
    queryKey: ['admin', 'site-configs', siteConfigKey, siteConfigLocale],
    queryFn: () =>
      adminApi.getSiteConfigs({
        key: siteConfigKey || undefined,
        locale: siteConfigLocale || undefined,
      }),
    enabled: isAdmin && activeSection === 'content',
    placeholderData: (previousData) => previousData,
  });

  const updateSiteConfigMutation = useMutation({
    mutationFn: ({
      key,
      payload,
    }: {
      key: string;
      payload: { locale?: string; value: Record<string, unknown>; description?: string };
    }) => adminApi.upsertSiteConfig(key, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'site-configs'] });
      toast.success('Site config saved');
    },
    onError: (error: unknown) => handleError(error, 'Failed to save site config'),
  });

  React.useEffect(() => {
    if (activeSection !== 'content') return;
    const selectedConfig = siteConfigsQuery.data?.find(
      (item) => item.key === siteConfigKey && item.locale === siteConfigLocale,
    );
    setSiteConfigDraft(JSON.stringify(selectedConfig?.value ?? {}, null, 2));
  }, [activeSection, siteConfigsQuery.data, siteConfigKey, siteConfigLocale]);

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { roleId?: 1 | 2; statusId?: 1 | 2 } }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('User updated');
    },
    onError: (error: unknown) => handleError(error, 'Failed to update user'),
  });

  const bulkUsersMutation = useMutation({
    mutationFn: (payload: { ids: number[]; roleId?: 1 | 2; statusId?: 1 | 2 }) =>
      adminApi.bulkUpdateUsers(payload),
    onSuccess: async () => {
      setSelectedUserIds([]);
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Bulk user update complete');
    },
    onError: (error: unknown) => handleError(error, 'Failed to bulk update users'),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminApi.updateTemplate(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Template updated');
    },
    onError: (error: unknown) => handleError(error, 'Failed to update template'),
  });

  const bulkTemplatesMutation = useMutation({
    mutationFn: (payload: {
      ids: string[];
      visibility?: 'public' | 'community' | 'private';
      listed?: boolean;
      featured?: boolean;
      priceCredits?: number;
      adminNote?: string;
      delete?: boolean;
    }) => adminApi.bulkUpdateTemplates(payload),
    onSuccess: async () => {
      setSelectedTemplateIds([]);
      await qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Bulk template moderation complete');
    },
    onError: (error: unknown) => handleError(error, 'Failed to bulk update templates'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: adminApi.deleteTemplate,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Template removed');
    },
    onError: (error: unknown) => handleError(error, 'Failed to delete template'),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: adminApi.deleteAsset,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'assets'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Asset removed');
    },
    onError: (error: unknown) => handleError(error, 'Failed to delete asset'),
  });

  const bulkAssetsMutation = useMutation({
    mutationFn: (payload: { ids: string[] }) => adminApi.bulkDeleteAssets(payload),
    onSuccess: async () => {
      setSelectedAssetIds([]);
      await qc.invalidateQueries({ queryKey: ['admin', 'assets'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      toast.success('Bulk asset removal complete');
    },
    onError: (error: unknown) => handleError(error, 'Failed to bulk delete assets'),
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAdminWorkspaceRequest }) =>
      adminApi.updateWorkspace(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'workspace', selectedWorkspaceId] }),
        qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
      ]);
      toast.success('Workspace updated');
    },
    onError: (error: unknown) => handleError(error, 'Failed to update workspace'),
  });

  const transferWorkspaceOwnerMutation = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      adminApi.transferWorkspaceOwner(id, { memberId }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'workspace', selectedWorkspaceId] }),
        qc.invalidateQueries({ queryKey: ['admin', 'overview'] }),
      ]);
      toast.success('Ownership transferred');
    },
    onError: (error: unknown) => handleError(error, 'Failed to transfer ownership'),
  });

  const updateWorkspaceMemberMutation = useMutation({
    mutationFn: ({
      id,
      memberId,
      role,
    }: {
      id: string;
      memberId: string;
      role?: string;
    }) => adminApi.updateWorkspaceMember(id, memberId, { role }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'workspace', selectedWorkspaceId] });
      await qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      toast.success('Member role updated');
    },
    onError: (error: unknown) => handleError(error, 'Failed to update member'),
  });

  const deleteWorkspaceMemberMutation = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      adminApi.deleteWorkspaceMember(id, memberId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'workspace', selectedWorkspaceId] });
      await qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      toast.success('Member removed');
    },
    onError: (error: unknown) => handleError(error, 'Failed to remove member'),
  });

  const bulkWorkspaceMembersMutation = useMutation({
    mutationFn: async ({
      id,
      memberIds,
      role,
      remove,
    }: {
      id: string;
      memberIds: string[];
      role?: string;
      remove?: boolean;
    }) => {
      const result = [] as Array<{ memberId: string; action: 'updated' | 'removed' }>;

      for (const memberId of memberIds) {
        if (remove) {
          await adminApi.deleteWorkspaceMember(id, memberId);
          result.push({ memberId, action: 'removed' });
          continue;
        }

        await adminApi.updateWorkspaceMember(id, memberId, { role });
        result.push({ memberId, action: 'updated' });
      }

      return result;
    },
    onSuccess: async (result) => {
      setSelectedWorkspaceMemberIds([]);
      await qc.invalidateQueries({ queryKey: ['admin', 'workspace', selectedWorkspaceId] });
      await qc.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      toast.success(`${result.length} workspace member(s) updated`);
    },
    onError: (error: unknown) => handleError(error, 'Failed to bulk update workspace members'),
  });

  const importMutation = useMutation({
    mutationFn: (dryRun: boolean) => {
      if (catalogSelectedSourceIds.length === 0) {
        throw new Error('Select at least one catalog source');
      }

      const parsedMaxItems = Number.parseInt(catalogMaxItems, 10);
      const maxItems = Number.isFinite(parsedMaxItems) && parsedMaxItems > 0 ? parsedMaxItems : 10;

      return adminApi.importCatalog({
        dryRun,
        force: catalogForce,
        sources: catalogSelectedSourceIds,
        maxItems,
      });
    },
    onSuccess: async (result: AdminCatalogImportResult) => {
      if (!result.dryRun) {
        await qc.invalidateQueries({ queryKey: ['admin', 'templates'] });
        await qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      }
      toast.success(result.dryRun ? 'Dry run complete' : 'Catalog imported');
    },
    onError: (error: unknown) => handleError(error, 'Failed to import catalog'),
  });

  const requeueDeadLetterMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.requeueDeadLetterJob(jobId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'queues'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'dead-letter'] }),
      ]);
      toast.success('Dead-letter job requeued');
    },
    onError: (error: unknown) => handleError(error, 'Failed to requeue dead-letter job'),
  });

  const users = usersQuery.data?.data ?? [];
  const templates = templatesQuery.data?.data ?? [];
  const assets = assetsQuery.data?.data ?? [];
  const workspaces = workspacesQuery.data?.data ?? [];
  const auditLogs = auditLogsQuery.data?.data ?? [];
  const adminSources = sourcesQuery.data ?? [];
  const queueSnapshot = queueSnapshotQuery.data;
  const deadLetterJobs = deadLetterJobsQuery.data ?? [];
  const selectedCatalogSourceCount = catalogSourcesInitialized
    ? catalogSelectedSourceIds.length
    : adminSources.length;
  const visibleUserIds = users.map((item) => item.id);
  const filteredWorkspaceMembers =
    workspaceDetailQuery.data?.members.filter((member) => {
      const query = workspaceMemberSearch.trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : [member.user?.email, member.user?.firstName, member.user?.lastName, String(member.userId)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
      const matchesRole = !workspaceMemberRoleFilter || member.role === workspaceMemberRoleFilter;
      return matchesSearch && matchesRole;
    }) ?? [];

  const toggleCatalogSource = (sourceId: string) => {
    setCatalogSourcesInitialized(true);
    setCatalogSelectedSourceIds((current) =>
      current.includes(sourceId)
        ? current.filter((item) => item !== sourceId)
        : [...current, sourceId],
    );
  };

  const selectAllCatalogSources = () => {
    setCatalogSourcesInitialized(true);
    setCatalogSelectedSourceIds(adminSources.map((source) => source.id));
  };

  const clearCatalogSources = () => {
    setCatalogSourcesInitialized(true);
    setCatalogSelectedSourceIds([]);
  };

  const selectAllVisibleUsers = () => {
    setSelectedUserIds(visibleUserIds);
  };

  const clearSelectedUsers = () => {
    setSelectedUserIds([]);
  };

  const toggleWorkspaceMemberSelection = (memberId: string) => {
    setSelectedWorkspaceMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((item) => item !== memberId)
        : [...current, memberId],
    );
  };

  const selectVisibleWorkspaceMembers = () => {
    setSelectedWorkspaceMemberIds(filteredWorkspaceMembers.map((member) => member.id));
  };

  const clearWorkspaceMemberSelection = () => {
    setSelectedWorkspaceMemberIds([]);
  };

  const overview = overviewQuery.data;
  const rolesMatrix = rolesMatrixQuery.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 md:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <Card className="w-full rounded-lg border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <CardTitle>Admin access required</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your session does not include an administrator role.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => push('/dashboard')}>Back to dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Users', value: overview?.users ?? 0, hint: 'Total accounts', icon: Users },
    { label: 'Templates', value: overview?.templates ?? 0, hint: 'Inventory records', icon: LayoutGrid },
    { label: 'Workspaces', value: overview?.workspaces ?? 0, hint: 'Workspace records', icon: Building2 },
    { label: 'Assets', value: overview?.assets ?? 0, hint: 'Generated/imported assets', icon: FileText },
    { label: 'Audit logs', value: overview?.auditLogs ?? 0, hint: 'Recorded actions', icon: Activity },
    { label: 'Sources', value: overview?.sources ?? 0, hint: 'External feeds', icon: Database },
  ];

  const toggleId = <T,>(current: T[], id: T, setter: (next: T[]) => void) => {
    setter(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Admin Console
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Operations</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              User governance, template moderation, bulk actions, audit history, and workspace management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshAll}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                activeSection === section.id && 'bg-foreground text-background hover:bg-foreground hover:text-background',
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {(activeSection === 'overview' || activeSection === 'roles') && (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="rounded-lg border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {metric.label}
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{metric.value}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{metric.hint}</div>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}

        {activeSection === 'overview' && (
          <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Operations queue</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 p-4 md:grid-cols-2">
                {[
                  ['Live queue snapshot', `${queueSnapshot?.queues.length ?? 0} queues tracked`],
                  ['Dead-letter recovery', `${deadLetterJobs.length} failed jobs ready`],
                  ['Moderate templates', `${templatesQuery.data?.total ?? 0} records available`],
                  ['Workspace directory', `${workspacesQuery.data?.total ?? 0} workspaces`],
                ].map(([title, hint]) => (
                  <div key={title} className="rounded-lg border border-border bg-background p-4">
                    <div className="text-sm font-medium">{title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Guardrails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {[
                  'Route guard redirects non-admin sessions.',
                  'Backend admin endpoints require JWT and RolesGuard.',
                  'Audit trail records every write/export/admin catalog action.',
                  'Template moderation writes reviewedAt metadata.',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'ops' && (
          <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="size-4" />
                      Queue snapshot
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Live counts for worker queues and the dead-letter archive.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void qc.invalidateQueries({ queryKey: ['admin', 'queues'] });
                      void qc.invalidateQueries({ queryKey: ['admin', 'dead-letter'] });
                    }}
                  >
                    <RefreshCw className="mr-2 size-4" />
                    Refresh
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Snapshot at {queueSnapshot?.timestamp ? new Date(queueSnapshot.timestamp).toLocaleString() : 'loading'}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {queueSnapshotQuery.isLoading && <Skeleton className="h-28 rounded-lg" />}
                {!queueSnapshotQuery.isLoading && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {(queueSnapshot?.queues ?? []).map((queue) => (
                      <div key={queue.queue} className="rounded-lg border border-border bg-background p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{queue.queue}</div>
                          <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                            {queue.counts.waiting + queue.counts.active + queue.counts.delayed} pending
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>Waiting: {queue.counts.waiting}</span>
                          <span>Active: {queue.counts.active}</span>
                          <span>Failed: {queue.counts.failed}</span>
                          <span>Delayed: {queue.counts.delayed}</span>
                          <span>Completed: {queue.counts.completed}</span>
                          <span>Paused: {queue.counts.paused}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4" />
                  Dead-letter recovery
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Inspect failed jobs and requeue them back to the original worker queue.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {deadLetterJobsQuery.isLoading && <Skeleton className="h-28 rounded-lg" />}
                {!deadLetterJobsQuery.isLoading && deadLetterJobs.length === 0 && (
                  <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                    No dead-letter jobs found.
                  </div>
                )}
                {!deadLetterJobsQuery.isLoading &&
                  deadLetterJobs.map((job: AdminDeadLetterJob) => (
                    <div key={String(job.id)} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{job.jobName}</span>
                            <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                              {job.sourceQueue}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Job {job.jobId ?? 'n/a'} / failed {job.attemptsMade} time(s)
                          </div>
                          <div className="text-xs text-muted-foreground">{job.errorMessage}</div>
                          <div className="text-xs text-muted-foreground">Failed at {job.failedAt}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={requeueDeadLetterMutation.isPending}
                          onClick={() => requeueDeadLetterMutation.mutate(String(job.id))}
                        >
                          Requeue
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'notifications' && <AdminNotificationsPanel />}

        {activeSection === 'users' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4" />
                    User directory
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search users, bulk change role/status, and export the filtered set.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CsvButton
                    label="Export CSV"
                    onClick={async () => {
                      const response = await adminApi.exportUsers({
                        q: userSearch || undefined,
                        roleId: userRole ? Number(userRole) : undefined,
                        statusId: userStatus ? Number(userStatus) : undefined,
                      });
                      downloadCsv('users.csv', response.data);
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(event) => {
                      setUserSearch(event.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search by name, email, role, or status"
                    className="pl-10"
                  />
                </div>
                <Select
                  value={userRole || 'all'}
                  onValueChange={(value) => {
                    setUserRole(value === 'all' ? '' : value);
                    setUserPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="1">Admin</SelectItem>
                    <SelectItem value="2">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={userStatus || 'all'}
                  onValueChange={(value) => {
                    setUserStatus(value === 'all' ? '' : value);
                    setUserPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <BulkBar
                count={selectedUserIds.length}
                actions={
                  <>
                    <Button size="sm" variant="outline" onClick={selectAllVisibleUsers}>
                      Select visible
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearSelectedUsers}>
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkUsersMutation.mutate({ ids: selectedUserIds, roleId: 1, statusId: undefined })
                      }
                    >
                      Make admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkUsersMutation.mutate({ ids: selectedUserIds, roleId: 2, statusId: undefined })
                      }
                    >
                      Make user
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkUsersMutation.mutate({ ids: selectedUserIds, statusId: 1, roleId: undefined })
                      }
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkUsersMutation.mutate({ ids: selectedUserIds, statusId: 2, roleId: undefined })
                      }
                    >
                      Deactivate
                    </Button>
                  </>
                }
              />

              <div className="divide-y divide-border rounded-lg border border-border">
                {usersQuery.isLoading && <Skeleton className="m-4 h-24 rounded-lg" />}
                {!usersQuery.isLoading &&
                  users.map((item: AdminUser) => (
                    <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[28px_1fr_160px_160px_160px_140px] lg:items-center">
                      <Checkbox
                        checked={selectedUserIds.includes(item.id)}
                        onCheckedChange={() => toggleId(selectedUserIds, item.id, setSelectedUserIds)}
                      />
                      <div>
                        <div className="text-sm font-medium">{formatPerson(item)}</div>
                        <div className="text-xs text-muted-foreground">{item.email ?? 'No email'}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setAuditSearch(item.email ?? formatPerson(item));
                              setAuditActorId(String(item.id));
                              setAuditEntityType('');
                              setAuditPage(1);
                              setActiveSection('audit');
                            }}
                          >
                            View audit
                          </Button>
                        </div>
                      </div>
                      <Select
                        value={String(item.role?.id ?? 2)}
                        onValueChange={(value) =>
                          updateUserMutation.mutate({
                            id: item.id,
                            payload: { roleId: Number(value) as 1 | 2 },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Admin</SelectItem>
                          <SelectItem value="2">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(item.status?.id ?? 1)}
                        onValueChange={(value) =>
                          updateUserMutation.mutate({
                            id: item.id,
                            payload: { statusId: Number(value) as 1 | 2 },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Active</SelectItem>
                          <SelectItem value="2">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <span
                        className={cn(
                          'w-fit rounded-md px-2 py-1 text-xs font-medium',
                          String(item.role?.id ?? '2') === '1'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {item.role?.name ?? 'User'}
                      </span>
                      <div className="flex justify-start lg:justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            setAuditSearch(item.email ?? formatPerson(item));
                            setAuditActorId(String(item.id));
                            setAuditEntityType('');
                            setAuditPage(1);
                            setActiveSection('audit');
                          }}
                        >
                          Open audit
                        </Button>
                      </div>
                    </div>
                  ))}
                {!usersQuery.isLoading && !users.length && (
                  <div className="p-4 text-sm text-muted-foreground">No users loaded.</div>
                )}
              </div>

              <PaginationControls
                page={userPage}
                hasNextPage={usersQuery.data?.hasNextPage ?? false}
                onPrev={() => setUserPage((page) => Math.max(1, page - 1))}
                onNext={() => setUserPage((page) => page + 1)}
              />
            </CardContent>
          </Card>
        )}

        {activeSection === 'templates' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="size-4" />
                    Template moderation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bulk update visibility, listing, featured flag, and pricing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CsvButton
                    label="Export CSV"
                    onClick={async () => {
                      const response = await adminApi.exportTemplates({
                        q: templateSearch || undefined,
                        visibility: templateVisibility || undefined,
                        type: templateType || undefined,
                        listed: templateListed ? templateListed === 'true' : undefined,
                        featured: templateFeatured ? templateFeatured === 'true' : undefined,
                      });
                      downloadCsv('templates.csv', response.data);
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={templateSearch}
                    onChange={(event) => {
                      setTemplateSearch(event.target.value);
                      setTemplatePage(1);
                    }}
                    placeholder="Search title, description, or author"
                    className="pl-10"
                  />
                </div>
                <Select
                  value={templateVisibility || 'all'}
                  onValueChange={(value) => {
                    setTemplateVisibility(value === 'all' ? '' : value);
                    setTemplatePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All visibility</SelectItem>
                    <SelectItem value="public">public</SelectItem>
                    <SelectItem value="community">community</SelectItem>
                    <SelectItem value="private">private</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={templateListed || 'all'}
                  onValueChange={(value) => {
                    setTemplateListed(value === 'all' ? '' : value);
                    setTemplatePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any listed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any listed</SelectItem>
                    <SelectItem value="true">listed</SelectItem>
                    <SelectItem value="false">unlisted</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={templateFeatured || 'all'}
                  onValueChange={(value) => {
                    setTemplateFeatured(value === 'all' ? '' : value);
                    setTemplatePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any featured" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any featured</SelectItem>
                    <SelectItem value="true">featured</SelectItem>
                    <SelectItem value="false">not featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={templateType}
                  onChange={(event) => {
                    setTemplateType(event.target.value);
                    setTemplatePage(1);
                  }}
                  placeholder="Type filter, e.g. image-generator"
                />
                <div className="flex gap-2">
                  <Input
                    value={bulkTemplateVisibility}
                    onChange={(event) => setBulkTemplateVisibility(event.target.value)}
                    placeholder="Bulk visibility"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={bulkTemplatePrice}
                    onChange={(event) => setBulkTemplatePrice(event.target.value)}
                    placeholder="Bulk price"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <BulkBar
                count={selectedTemplateIds.length}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkTemplatesMutation.mutate({
                          ids: selectedTemplateIds,
                          visibility: (bulkTemplateVisibility as 'public' | 'community' | 'private') || undefined,
                        })
                      }
                    >
                      Apply visibility
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        bulkTemplatesMutation.mutate({
                          ids: selectedTemplateIds,
                          priceCredits: bulkTemplatePrice ? Number(bulkTemplatePrice) : undefined,
                        })
                      }
                    >
                      Apply price
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => bulkTemplatesMutation.mutate({ ids: selectedTemplateIds, delete: true })}
                    >
                      Delete selected
                    </Button>
                  </>
                }
              />

              <div className="divide-y divide-border rounded-lg border border-border">
                {templatesQuery.isLoading && <Skeleton className="m-4 h-24 rounded-lg" />}
                {!templatesQuery.isLoading &&
                  templates.map((template: AdminTemplate) => {
                    const marketplace = template.content?.marketplace ?? {};
                    return (
                      <div key={template.id} className="grid gap-4 p-4 xl:grid-cols-[28px_1fr_360px] xl:items-center">
                        <Checkbox
                          checked={selectedTemplateIds.includes(template.id)}
                          onCheckedChange={() => toggleId(selectedTemplateIds, template.id, setSelectedTemplateIds)}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-medium">{template.title}</div>
                            <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                              {template.visibility}
                            </span>
                            {marketplace.featured && (
                              <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary">
                                featured
                              </span>
                            )}
                            {marketplace.listed && (
                              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-600">
                                listed
                              </span>
                            )}
                          </div>
                          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {template.description || 'No description'}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {template.type} / {template.usageCount ?? 0} uses / {formatPerson(template.author)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:justify-end">
                          <Select
                            value={template.visibility}
                            onValueChange={(value) =>
                              updateTemplateMutation.mutate({
                                id: template.id,
                                payload: { visibility: value },
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-[140px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">public</SelectItem>
                              <SelectItem value="community">community</SelectItem>
                              <SelectItem value="private">private</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0}
                            value={marketplace.priceCredits ?? 0}
                            onChange={(event) =>
                              updateTemplateMutation.mutate({
                                id: template.id,
                                payload: { priceCredits: Number.parseInt(event.target.value, 10) || 0 },
                              })
                            }
                            className="h-9 w-20 text-xs"
                          />
                          <Button
                            size="sm"
                            variant={marketplace.listed ? 'default' : 'outline'}
                            onClick={() =>
                              updateTemplateMutation.mutate({
                                id: template.id,
                                payload: { listed: !marketplace.listed },
                              })
                            }
                          >
                            {marketplace.listed ? 'Listed' : 'List'}
                          </Button>
                          <Button
                            size="sm"
                            variant={marketplace.featured ? 'default' : 'outline'}
                            onClick={() =>
                              updateTemplateMutation.mutate({
                                id: template.id,
                                payload: { featured: !marketplace.featured },
                              })
                            }
                          >
                            Feature
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleteTemplateMutation.isPending}
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                {!templatesQuery.isLoading && !templates.length && (
                  <div className="p-4 text-sm text-muted-foreground">No templates loaded.</div>
                )}
              </div>

              <PaginationControls
                page={templatePage}
                hasNextPage={templatesQuery.data?.hasNextPage ?? false}
                onPrev={() => setTemplatePage((page) => Math.max(1, page - 1))}
                onNext={() => setTemplatePage((page) => page + 1)}
              />
            </CardContent>
          </Card>
        )}

        {activeSection === 'assets' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="size-4" />
                    Asset moderation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search generated assets and remove bad inventory in bulk.
                  </p>
                </div>
                <CsvButton
                  label="Export CSV"
                  onClick={async () => {
                    const response = await adminApi.exportAssets({
                      q: assetSearch || undefined,
                      type: assetType || undefined,
                    });
                    downloadCsv('assets.csv', response.data);
                  }}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={assetSearch}
                    onChange={(event) => {
                      setAssetSearch(event.target.value);
                      setAssetPage(1);
                    }}
                    placeholder="Search by URL, metadata, or project"
                    className="pl-10"
                  />
                </div>
                <Select
                  value={assetType || 'all'}
                  onValueChange={(value) => {
                    setAssetType(value === 'all' ? '' : value);
                    setAssetPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="image">image</SelectItem>
                    <SelectItem value="video">video</SelectItem>
                    <SelectItem value="audio">audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <BulkBar
                count={selectedAssetIds.length}
                actions={
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => bulkAssetsMutation.mutate({ ids: selectedAssetIds })}
                  >
                    Delete selected
                  </Button>
                }
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assetsQuery.isLoading && <Skeleton className="h-52 rounded-lg" />}
                {!assetsQuery.isLoading &&
                  assets.map((asset: AdminAsset) => (
                    <div key={asset.id} className="overflow-hidden rounded-lg border border-border bg-background">
                      <div className="relative aspect-video bg-muted">
                        {asset.type === 'image' ? (
                          <Image
                            src={asset.url}
                            alt=""
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            {asset.type}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium">{String(asset.metadata?.category ?? asset.type)}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                              {String(asset.metadata?.prompt ?? asset.url)}
                            </div>
                          </div>
                          <Checkbox
                            checked={selectedAssetIds.includes(asset.id)}
                            onCheckedChange={() => toggleId(selectedAssetIds, asset.id, setSelectedAssetIds)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">User #{asset.userId}</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleteAssetMutation.isPending}
                            onClick={() => deleteAssetMutation.mutate(asset.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {!assetsQuery.isLoading && !assets.length && (
                  <div className="p-4 text-sm text-muted-foreground">No assets loaded.</div>
                )}
              </div>

              <PaginationControls
                page={assetPage}
                hasNextPage={assetsQuery.data?.hasNextPage ?? false}
                onPrev={() => setAssetPage((page) => Math.max(1, page - 1))}
                onNext={() => setAssetPage((page) => page + 1)}
              />
            </CardContent>
          </Card>
        )}

        {activeSection === 'workspaces' && (
          <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="size-4" />
                      Workspace directory
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Workspace ownership, domains, and member counts.
                    </p>
                  </div>
                  <CsvButton
                    label="Export CSV"
                    onClick={async () => {
                      const response = await adminApi.exportWorkspaces({ q: workspaceSearch || undefined });
                      downloadCsv('workspaces.csv', response.data);
                    }}
                  />
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={workspaceSearch}
                    onChange={(event) => {
                      setWorkspaceSearch(event.target.value);
                      setWorkspacePage(1);
                    }}
                    placeholder="Search workspace name, slug, domain"
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-0">
                <div className="divide-y divide-border">
                  {workspacesQuery.isLoading && <Skeleton className="m-4 h-24 rounded-lg" />}
                  {!workspacesQuery.isLoading &&
                    workspaces.map((workspace: AdminWorkspace) => (
                      <div
                        key={workspace.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWorkspaceId(workspace.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedWorkspaceId(workspace.id);
                          }
                        }}
                        className={cn(
                          'grid w-full gap-3 p-4 text-left transition-colors hover:bg-muted/40 md:grid-cols-[1fr_140px_140px_140px] md:items-center',
                          selectedWorkspaceId === workspace.id && 'bg-muted/50',
                        )}
                      >
                        <div>
                          <div className="text-sm font-medium">{workspace.name}</div>
                          <div className="text-xs text-muted-foreground">
                            /workspaces/{workspace.slug} {workspace.domain ? `/ ${workspace.domain}` : ''}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{workspace.memberCount} members</span>
                        <span className="text-xs text-muted-foreground">Owner #{workspace.ownerId}</span>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              setAuditSearch(workspace.name || workspace.slug);
                              setAuditEntityType('workspace');
                              setAuditActorId('');
                              setAuditPage(1);
                              setActiveSection('audit');
                          }}
                          >
                            View audit
                          </Button>
                        </div>
                      </div>
                    ))}
                  {!workspacesQuery.isLoading && !workspaces.length && (
                    <div className="p-4 text-sm text-muted-foreground">No workspaces loaded.</div>
                  )}
                </div>

                <div className="p-4">
                  <PaginationControls
                    page={workspacePage}
                    hasNextPage={workspacesQuery.data?.hasNextPage ?? false}
                    onPrev={() => setWorkspacePage((page) => Math.max(1, page - 1))}
                    onNext={() => setWorkspacePage((page) => page + 1)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <KeyRound className="size-4" />
                      Workspace detail
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Update workspace metadata, transfer ownership, and manage members.
                    </p>
                  </div>
                  {workspaceDetailQuery.data && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push(`/workspaces/${workspaceDetailQuery.data.slug}/members`)}
                      >
                        Members page
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push(`/workspaces/${workspaceDetailQuery.data.slug}/settings`)}
                      >
                        Settings page
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push(`/workspaces/${workspaceDetailQuery.data.slug}/projects`)}
                      >
                        Projects page
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => push(`/workspaces/${workspaceDetailQuery.data.slug}/billing`)}
                      >
                        Billing page
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {!workspaceDetailQuery.data && <div className="text-sm text-muted-foreground">Select a workspace.</div>}
                {workspaceDetailQuery.data && (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Name" />
                      <Input value={workspaceSlug} onChange={(event) => setWorkspaceSlug(event.target.value)} placeholder="Slug" />
                      <Input value={workspaceUrl} onChange={(event) => setWorkspaceUrl(event.target.value)} placeholder="URL" />
                      <Input value={workspaceDomain} onChange={(event) => setWorkspaceDomain(event.target.value)} placeholder="Domain" />
                    </div>
                    <Input
                      value={workspaceAvatarUrl}
                      onChange={(event) => setWorkspaceAvatarUrl(event.target.value)}
                      placeholder="Avatar URL"
                    />
                    <Input
                      value={workspaceDescription}
                      onChange={(event) => setWorkspaceDescription(event.target.value)}
                      placeholder="Description"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={workspaceAttachByDomain}
                        onChange={(event) => setWorkspaceAttachByDomain(event.target.checked)}
                      />
                      <span className="text-sm">Attach users by domain</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                      <Input
                        value={workspaceOwnerId}
                        onChange={(event) => setWorkspaceOwnerId(event.target.value)}
                        placeholder="Owner user id"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateWorkspaceMutation.mutate({
                            id: workspaceDetailQuery.data.id,
                            payload: {
                              name: workspaceName,
                              slug: workspaceSlug,
                              url: workspaceUrl,
                              description: workspaceDescription,
                              domain: workspaceDomain || null,
                              shouldAttachUsersByDomain: workspaceAttachByDomain,
                              avatarUrl: workspaceAvatarUrl,
                              ownerId: workspaceOwnerId ? Number(workspaceOwnerId) : undefined,
                            },
                          })
                        }
                      >
                        Save workspace
                      </Button>
                    </div>

                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-medium">Members</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {['', 'ADMIN', 'MEMBER', 'BILLING'].map((role) => (
                            <button
                              key={role || 'all'}
                              type="button"
                              onClick={() => setWorkspaceMemberRoleFilter(role)}
                              className={cn(
                                'rounded-full border px-3 py-1.5 font-medium transition-colors',
                                workspaceMemberRoleFilter === role
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background text-muted-foreground',
                              )}
                            >
                              {role || 'All roles'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={workspaceMemberSearch}
                          onChange={(event) => setWorkspaceMemberSearch(event.target.value)}
                          placeholder="Search member name or email"
                          className="pl-10"
                        />
                      </div>
                      <BulkBar
                        count={selectedWorkspaceMemberIds.length}
                        actions={
                          <>
                            <Button size="sm" variant="outline" onClick={selectVisibleWorkspaceMembers}>
                              Select visible
                            </Button>
                            <Button size="sm" variant="outline" onClick={clearWorkspaceMemberSelection}>
                              Clear
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selectedWorkspaceMemberIds.length === 0}
                              onClick={() =>
                                bulkWorkspaceMembersMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberIds: selectedWorkspaceMemberIds,
                                  role: 'ADMIN',
                                })
                              }
                            >
                              Make admin
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selectedWorkspaceMemberIds.length === 0}
                              onClick={() =>
                                bulkWorkspaceMembersMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberIds: selectedWorkspaceMemberIds,
                                  role: 'MEMBER',
                                })
                              }
                            >
                              Make member
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selectedWorkspaceMemberIds.length === 0}
                              onClick={() =>
                                bulkWorkspaceMembersMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberIds: selectedWorkspaceMemberIds,
                                  role: 'BILLING',
                                })
                              }
                            >
                              Make billing
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={selectedWorkspaceMemberIds.length === 0}
                              onClick={() =>
                                bulkWorkspaceMembersMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberIds: selectedWorkspaceMemberIds,
                                  remove: true,
                                })
                              }
                            >
                              Remove selected
                            </Button>
                          </>
                        }
                      />
                      <div className="space-y-2">
                        {filteredWorkspaceMembers.map((member) => (
                          <div
                            key={member.id}
                            className="grid gap-2 rounded-md border border-border px-3 py-2 md:grid-cols-[28px_1fr_120px_110px_110px]"
                          >
                            <Checkbox
                              checked={selectedWorkspaceMemberIds.includes(member.id)}
                              onCheckedChange={() => toggleWorkspaceMemberSelection(member.id)}
                            />
                            <div>
                              <div className="text-sm font-medium">{formatPerson(member.user)}</div>
                              <div className="text-xs text-muted-foreground">#{member.userId}</div>
                            </div>
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                updateWorkspaceMemberMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberId: member.id,
                                  role: value,
                                })
                              }
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="MEMBER">MEMBER</SelectItem>
                                <SelectItem value="BILLING">BILLING</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                transferWorkspaceOwnerMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberId: member.id,
                                })
                              }
                            >
                              Transfer
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteWorkspaceMemberMutation.mutate({
                                  id: workspaceDetailQuery.data.id,
                                  memberId: member.id,
                                })
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                      {filteredWorkspaceMembers.length === 0 && (
                        <div className="mt-3 text-sm text-muted-foreground">No members match this filter.</div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'audit' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4" />
                    Audit logs
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track moderation, workspace changes, catalog imports, and exports.
                  </p>
                </div>
                <CsvButton
                  label="Export CSV"
                  onClick={async () => {
                    const response = await adminApi.exportAuditLogs({
                      q: auditSearch || undefined,
                      action: auditAction || undefined,
                      entityType: auditEntityType || undefined,
                      actorId: auditActorIdValue,
                      from: auditFrom || undefined,
                      to: auditTo || undefined,
                    });
                    downloadCsv('audit-logs.csv', response.data);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditAction('');
                    setAuditEntityType('');
                    setAuditActorId('');
                    setAuditFrom('');
                    setAuditTo('');
                    setAuditPage(1);
                  }}
                >
                  Clear filters
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
                <div className="relative md:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={auditSearch}
                    onChange={(event) => {
                      setAuditSearch(event.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="Search actor, action, entity, id"
                    className="pl-10"
                  />
                </div>
                <Input
                  value={auditAction}
                  onChange={(event) => {
                    setAuditAction(event.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Action filter"
                />
                <Input
                  value={auditEntityType}
                  onChange={(event) => {
                    setAuditEntityType(event.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Entity type filter"
                />
                <Input
                  value={auditActorId}
                  onChange={(event) => {
                    setAuditActorId(event.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="Actor ID"
                  inputMode="numeric"
                />
                <Input
                  type="date"
                  value={auditFrom}
                  onChange={(event) => {
                    setAuditFrom(event.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={auditTo}
                  onChange={(event) => {
                    setAuditTo(event.target.value);
                    setAuditPage(1);
                  }}
                  placeholder="To"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAuditAction('');
                    setAuditEntityType('');
                    setAuditActorId('');
                    setAuditFrom('');
                    setAuditTo('');
                    setAuditPage(1);
                  }}
                >
                  Keep search only
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditPage(1);
                  }}
                >
                  Clear search
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="divide-y divide-border rounded-lg border border-border">
                {auditLogsQuery.isLoading && <Skeleton className="m-4 h-24 rounded-lg" />}
                {!auditLogsQuery.isLoading &&
                  auditLogs.map((entry: AdminAuditLog) => (
                    <div key={entry.id} className="p-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{entry.action}</span>
                            <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                              {entry.entityType}
                            </span>
                            {!entry.success && (
                              <span className="rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                                failed
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Actor {entry.actorEmail ?? `#${entry.actorId}`} {entry.entityName ? `- ${entry.entityName}` : ''}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {entry.meta ? JSON.stringify(entry.meta) : 'No metadata'}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setAuditActorId(String(entry.actorId));
                                setAuditPage(1);
                              }}
                            >
                              Filter actor
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setAuditAction(entry.action);
                                setAuditPage(1);
                              }}
                            >
                              Filter action
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setAuditEntityType(entry.entityType);
                                setAuditPage(1);
                              }}
                            >
                              Filter entity
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:items-end">
                          <ClientDateTime value={entry.createdAt} />
                          {entry.entityId && <div>Entity ID: {entry.entityId}</div>}
                          {entry.error && <div className="text-destructive">{entry.error}</div>}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => toggleAuditLogExpanded(entry.id)}
                          >
                            {isAuditLogExpanded(entry.id) ? (
                              <ChevronDown className="mr-2 size-3.5" />
                            ) : (
                              <ChevronRight className="mr-2 size-3.5" />
                            )}
                            {isAuditLogExpanded(entry.id) ? 'Hide details' : 'Show details'}
                          </Button>
                        </div>
                      </div>
                      {isAuditLogExpanded(entry.id) && (
                        <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-3">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Before</div>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-5">
                              {entry.before ? JSON.stringify(entry.before, null, 2) : 'No before snapshot'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">After</div>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-5">
                              {entry.after ? JSON.stringify(entry.after, null, 2) : 'No after snapshot'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Meta</div>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-5">
                              {entry.meta ? JSON.stringify(entry.meta, null, 2) : 'No metadata'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                {!auditLogsQuery.isLoading && !auditLogs.length && (
                  <div className="p-4 text-sm text-muted-foreground">No audit records found.</div>
                )}
              </div>

              <PaginationControls
                page={auditPage}
                hasNextPage={auditLogsQuery.data?.hasNextPage ?? false}
                onPrev={() => setAuditPage((page) => Math.max(1, page - 1))}
                onNext={() => setAuditPage((page) => page + 1)}
              />
            </CardContent>
          </Card>
        )}

        {activeSection === 'catalog' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Download className="size-4" />
                    External catalog import
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select one or more sources, set the batch size, and choose whether to force overwrite duplicates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={selectAllCatalogSources}>
                    Select all
                  </Button>
                  <Button variant="outline" onClick={clearCatalogSources}>
                    Clear
                  </Button>
                  <Button variant="outline" onClick={() => importMutation.mutate(true)}>
                    Dry run
                  </Button>
                  <Button onClick={() => importMutation.mutate(false)}>Import</Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={`${selectedCatalogSourceCount} source(s) selected`}
                  readOnly
                  placeholder="Selected sources"
                />
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={catalogMaxItems}
                  onChange={(event) => setCatalogMaxItems(event.target.value)}
                  placeholder="Max items per source"
                />
                <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={catalogForce}
                    onChange={(event) => setCatalogForce(event.target.checked)}
                  />
                  Force import
                </label>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                Sources are managed in the backend seed catalog and imported through the same admin route.
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {adminSources.map((source) => {
                  const selected = catalogSelectedSourceIds.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => toggleCatalogSource(source.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{source.name}</div>
                          <div className="text-xs text-muted-foreground">{source.id}</div>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                          {selected ? 'selected' : 'off'}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                        <span>Kind: {source.kind}</span>
                        <span>Visibility: {source.visibility}</span>
                        <span>Default type: {source.defaultType ?? 'n/a'}</span>
                        <span>Max items: {source.maxItems}</span>
                        <span>Featured: {source.featuredCount}</span>
                        <span>Price: {source.defaultPriceCredits} credits</span>
                        {source.sourceLicense && <span>License: {source.sourceLicense}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {source.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              {importMutation.data && (
                <div className="space-y-2">
                  {importMutation.data.results.map((item) => (
                    <div key={item.sourceId} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{item.sourceName}</div>
                          <div className="text-xs text-muted-foreground">{item.sourceId}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{item.discovered} discovered</div>
                          <div>{item.inserted} inserted / {item.skipped} skipped</div>
                        </div>
                      </div>
                      {item.samples.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.samples.map((sample) => (
                            <span key={sample} className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                              {sample}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === 'content' && (
          <Card className="rounded-lg border-border">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutGrid className="size-4" />
                    Content config
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Edit landing, navigation, and stock content as JSON. The FE keeps defaults as fallback.
                  </p>
                </div>
                <Button
                  onClick={saveSiteConfig}
                  disabled={updateSiteConfigMutation.isPending}
                >
                  {updateSiteConfigMutation.isPending ? 'Saving...' : 'Save config'}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="site-config-key" className="mb-2 block text-xs font-medium text-muted-foreground">Config key</label>
                  <Select value={siteConfigKey} onValueChange={(value) => setSiteConfigKey(value)}>
                    <SelectTrigger id="site-config-key" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landing">landing</SelectItem>
                      <SelectItem value="navigation">navigation</SelectItem>
                      <SelectItem value="stock">stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="site-config-locale" className="mb-2 block text-xs font-medium text-muted-foreground">Locale</label>
                  <Select value={siteConfigLocale} onValueChange={(value) => setSiteConfigLocale(value)}>
                    <SelectTrigger id="site-config-locale" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">en</SelectItem>
                      <SelectItem value="vi">vi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                {siteConfigsQuery.data?.length
                  ? `Loaded ${siteConfigsQuery.data.length} record(s) for this filter.`
                  : 'No saved config yet. The FE will use bundled defaults until you save one.'}
              </div>
              <Textarea
                value={siteConfigDraft}
                onChange={(event) => setSiteConfigDraft(event.target.value)}
                className="min-h-[320px] w-full font-mono text-xs leading-6"
                spellCheck={false}
              />
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Stored values replace the default arrays or labels for the selected key.</span>
                <Button variant="outline" onClick={() => setSiteConfigDraft('{}')}>
                  Reset draft
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'roles' && (
          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="size-4" />
                  Platform roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {rolesMatrix?.platformRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{role.name}</div>
                      <span className="text-xs text-muted-foreground">#{role.id}</span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <span>Admin access: {role.canAccessAdmin ? 'Yes' : 'No'}</span>
                      <span>Manage users: {role.canManageUsers ? 'Yes' : 'No'}</span>
                      <span>Manage templates: {role.canManageTemplates ? 'Yes' : 'No'}</span>
                      <span>Manage assets: {role.canManageAssets ? 'Yes' : 'No'}</span>
                      <span>Manage workspaces: {role.canManageWorkspaces ? 'Yes' : 'No'}</span>
                      <span>View audit logs: {role.canViewAuditLogs ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="size-4" />
                  Moderation matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {rolesMatrix?.workspaceRoles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{role.name}</div>
                      <span className="text-xs text-muted-foreground">{role.id}</span>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <span>Manage members: {role.canManageMembers ? 'Yes' : 'No'}</span>
                      <span>Transfer ownership: {role.canTransferOwnership ? 'Yes' : 'No'}</span>
                      <span>Billing access: {role.canBill ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                  Allowed moderation actions: {rolesMatrix?.moderationActions?.join(', ') ?? '...'}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
