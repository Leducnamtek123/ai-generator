import { useCallback, useState } from 'react';
import { orgApi } from '@/services/orgApi';
import { memberApi } from '@/services/memberApi';
import { projectApi, type Project } from '@/services/projectApi';
import { inviteApi, type Invite } from '@/services/inviteApi';
import { billingApi, type BillingDetails } from '@/services/billingApi';
import { useOrgStore } from '@/stores/org-store';
import type { Member } from '@/services/orgApi';

export function useOrganization(orgSlug?: string) {
  const {
    currentOrg,
    organizations,
    currentMembership,
    setCurrentOrg,
    setOrganizations,
    setCurrentMembership,
    getCurrentRole,
    hasPermission,
  } = useOrgStore();

  const slug = orgSlug || currentOrg?.slug;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const orgs = await orgApi.list();
      setOrganizations(orgs);
      return orgs;
    } catch {
      setError('Failed to load organizations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [setOrganizations]);

  const loadMembership = useCallback(async () => {
    if (!slug) return null;
    try {
      const data = await orgApi.getMembership(slug);
      setCurrentMembership(data.member);
      return data;
    } catch {
      return null;
    }
  }, [slug, setCurrentMembership]);

  const loadMembers = useCallback(async (): Promise<Member[]> => {
    if (!slug) return [];
    try {
      return await memberApi.list(slug);
    } catch {
      return [];
    }
  }, [slug]);

  const loadProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const data = await projectApi.list();
      return data.data || [];
    } catch {
      return [];
    }
  }, []);

  const loadInvites = useCallback(async (): Promise<Invite[]> => {
    if (!slug) return [];
    try {
      return await inviteApi.list(slug);
    } catch {
      return [];
    }
  }, [slug]);

  const loadBilling = useCallback(async (): Promise<BillingDetails | null> => {
    if (!slug) return null;
    try {
      return await billingApi.get(slug);
    } catch {
      return null;
    }
  }, [slug]);

  return {
    // State
    currentOrg,
    organizations,
    currentMembership,
    loading,
    error,
    role: getCurrentRole(),

    // Permissions
    hasPermission,
    canManageOrg: hasPermission('update', 'Organization'),
    canDeleteOrg: hasPermission('delete', 'Organization'),
    canCreateProject: hasPermission('create', 'Project'),
    canManageMembers: hasPermission('update', 'User'),
    canInviteMembers: hasPermission('create', 'Invite'),
    canViewBilling: hasPermission('read', 'Billing'),

    // Loaders
    loadOrganizations,
    loadMembership,
    loadMembers,
    loadProjects,
    loadInvites,
    loadBilling,

    // Actions
    setCurrentOrg,
  };
}
