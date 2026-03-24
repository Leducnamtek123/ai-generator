import { api } from "@/lib/api";

export interface Invite {
  id: string;
  email: string;
  role: string;
  orgId: string;
  createdAt: string;
}

export interface InviteDetails {
  invite: Invite;
  org?: { name: string; slug: string };
  author?: { userInfo?: { name: string; email: string } };
}

export interface CreateInviteData {
  email: string;
  role: "ADMIN" | "MEMBER" | "BILLING";
}

// Matches: InvitesController with mixed routes
export const inviteApi = {
  // POST /orgs/:orgSlug/invites
  create: async (orgSlug: string, data: CreateInviteData): Promise<Invite> => {
    const res = await api.post(`/orgs/${orgSlug}/invites`, data);
    return res.data;
  },

  // GET /orgs/:orgSlug/invites
  list: async (orgSlug: string): Promise<Invite[]> => {
    const res = await api.get(`/orgs/${orgSlug}/invites`);
    return res.data;
  },

  // GET /invites/pending
  getPending: async (): Promise<Invite[]> => {
    const res = await api.get("/invites/pending");
    return res.data;
  },

  // POST /invites/:inviteId/accept
  accept: async (inviteId: string): Promise<void> => {
    await api.post(`/invites/${inviteId}/accept`);
  },

  // POST /invites/:inviteId/reject
  reject: async (inviteId: string): Promise<void> => {
    await api.post(`/invites/${inviteId}/reject`);
  },

  // DELETE /orgs/:orgSlug/invites/:inviteId
  delete: async (orgSlug: string, inviteId: string): Promise<void> => {
    await api.delete(`/orgs/${orgSlug}/invites/${inviteId}`);
  },

  // For invite acceptance page - get details 
  getDetails: async (inviteId: string): Promise<InviteDetails> => {
    const res = await api.get(`/invites/${inviteId}`);
    return res.data;
  },
};
