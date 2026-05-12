import { api } from "@/lib/api";

export interface UpdateMemberData {
  role: "ADMIN" | "MEMBER" | "BILLING";
}

// Matches: Controller path 'workspaces/:workspaceSlug/members', version '1'
export const memberApi = {
  // GET /workspaces/:workspaceSlug/members
  list: async (workspaceSlug: string) => {
    const res = await api.get(`/workspaces/${workspaceSlug}/members`);
    return res.data;
  },

  // PATCH /workspaces/:workspaceSlug/members/:memberId
  updateRole: async (
    workspaceSlug: string,
    memberId: string,
    data: UpdateMemberData
  ) => {
    const res = await api.patch(
      `/workspaces/${workspaceSlug}/members/${memberId}`,
      data
    );
    return res.data;
  },

  // DELETE /workspaces/:workspaceSlug/members/:memberId
  remove: async (workspaceSlug: string, memberId: string) => {
    const res = await api.delete(`/workspaces/${workspaceSlug}/members/${memberId}`);
    return res.data;
  },
};
