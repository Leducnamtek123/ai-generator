import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, Member } from "@/services/orgApi";

export type UserRole = "ADMIN" | "MEMBER" | "BILLING";

interface OrgState {
  // Current selected organization
  currentOrg: Organization | null;
  currentMembership: Member | null;
  organizations: Organization[];

  // Actions
  setCurrentOrg: (org: Organization | null) => void;
  setCurrentMembership: (member: Member | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  getCurrentRole: () => UserRole | null;
  hasPermission: (action: string, subject: string) => boolean;
  reset: () => void;
}

// Simple permission check based on role
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  ADMIN: {
    Organization: ["create", "read", "update", "delete", "transfer_ownership"],
    Project: ["create", "read", "update", "delete"],
    User: ["read", "update", "delete"],
    Invite: ["create", "read", "delete"],
    Billing: ["read"],
  },
  MEMBER: {
    Organization: ["create", "read"],
    Project: ["create", "read"],
    User: ["read"],
    Invite: [],
    Billing: [],
  },
  BILLING: {
    Organization: ["create", "read"],
    Project: ["read"],
    User: [],
    Invite: [],
    Billing: ["read", "manage"],
  },
};

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentOrg: null,
      currentMembership: null,
      organizations: [],

      setCurrentOrg: (org) => set({ currentOrg: org }),
      setCurrentMembership: (member) => set({ currentMembership: member }),
      setOrganizations: (orgs) => set({ organizations: orgs }),

      getCurrentRole: () => {
        const membership = get().currentMembership;
        if (!membership?.roles?.length) return null;
        // Return the highest priority role
        const roles = membership.roles.map((r) => r.role);
        if (roles.includes("ADMIN")) return "ADMIN";
        if (roles.includes("BILLING")) return "BILLING";
        return "MEMBER";
      },

      hasPermission: (action, subject) => {
        const role = get().getCurrentRole();
        if (!role) return false;
        if (role === "ADMIN" && action === "manage") return true;
        const perms = rolePermissions[role]?.[subject] || [];
        return perms.includes(action) || perms.includes("manage");
      },

      reset: () =>
        set({
          currentOrg: null,
          currentMembership: null,
          organizations: [],
        }),
    }),
    {
      name: "saas-org-storage",
      partialize: (state) => ({
        currentOrg: state.currentOrg,
        organizations: state.organizations,
      }),
    }
  )
);
