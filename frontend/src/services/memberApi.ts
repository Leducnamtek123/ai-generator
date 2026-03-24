import { api } from "@/lib/api";

export interface UpdateMemberData {
  role: "ADMIN" | "MEMBER" | "BILLING";
}

// Matches: Controller path 'orgs/:orgSlug/members', version '1'
export const memberApi = {
  // GET /orgs/:orgSlug/members
  list: async (orgSlug: string) => {
    const res = await api.get(`/orgs/${orgSlug}/members`);
    return res.data;
  },

  // PATCH /orgs/:orgSlug/members/:memberId
  updateRole: async (
    orgSlug: string,
    memberId: string,
    data: UpdateMemberData
  ) => {
    const res = await api.patch(
      `/orgs/${orgSlug}/members/${memberId}`,
      data
    );
    return res.data;
  },

  // DELETE /orgs/:orgSlug/members/:memberId
  remove: async (orgSlug: string, memberId: string) => {
    const res = await api.delete(`/orgs/${orgSlug}/members/${memberId}`);
    return res.data;
  },
};
