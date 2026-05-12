import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, Member } from "@/services/workspaceApi";

type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "BILLING" | "VIEWER";

interface OrgState {
  // Current selected workspace
  currentWorkspace: Workspace | null;
  currentMembership: Member | null;
  workspaces: Workspace[];

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setCurrentMembership: (member: Member | null) => void;
  setWorkspaces: (workspaces: Workspace[] | ((current: Workspace[]) => Workspace[])) => void;
  getCurrentRole: () => UserRole | null;
  hasPermission: (action: string, subject: string) => boolean;
  reset: () => void;
}

// Simple permission check based on role
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  OWNER: {
    all: ["manage"],
  },
  ADMIN: {
    Workspace: ["read", "update"],
    Project: ["create", "read", "update", "delete"],
    User: ["read", "update", "delete"],
    Invite: ["create", "read", "delete"],
    Billing: ["read"],
    all: ["manage"],
  },
  MEMBER: {
    Workspace: ["read"],
    Project: ["create", "read", "update", "delete"],
    User: ["read"],
    Invite: [],
    Billing: [],
  },
  VIEWER: {
    Workspace: ["read"],
    Project: ["read"],
    User: ["read"],
    Invite: [],
    Billing: [],
  },
  BILLING: {
    Workspace: ["read"],
    Project: ["read"],
    User: [],
    Invite: [],
    Billing: ["read", "manage"],
  },
};

export const useWorkspaceStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      currentMembership: null,
      workspaces: [],

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setCurrentMembership: (member) => set({ currentMembership: member }),
      setWorkspaces: (workspaces) =>
        set((state) => ({
          workspaces: typeof workspaces === "function" ? workspaces(state.workspaces) : workspaces,
        })),

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
          currentWorkspace: null,
          currentMembership: null,
          workspaces: [],
        }),
    }),
    {
      name: "saas-workspace-storage",
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        workspaces: state.workspaces,
      }),
    }
  )
);
