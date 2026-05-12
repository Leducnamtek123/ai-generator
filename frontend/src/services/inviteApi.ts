import { api } from "@/lib/api";

export interface Invite {
  id: string;
  email: string;
  role: string;
  workspaceId: string;
  createdAt: string;
}

export interface InviteDetails {
  invite: Invite;
  workspace?: { name: string; slug: string };
  author?: { userInfo?: { name: string; email: string } };
}

export interface CreateInviteData {
  email: string;
  role: "ADMIN" | "MEMBER" | "BILLING";
}

// Matches: InvitesController with workspace routes
export const inviteApi = {
  // POST /workspaces/:workspaceSlug/invites
  create: async (workspaceSlug: string, data: CreateInviteData): Promise<Invite> => {
    const res = await api.post(`/workspaces/${workspaceSlug}/invites`, data);
    return res.data;
  },

  // GET /workspaces/:workspaceSlug/invites
  list: async (workspaceSlug: string): Promise<Invite[]> => {
    const res = await api.get(`/workspaces/${workspaceSlug}/invites`);
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

  // DELETE /workspaces/:workspaceSlug/invites/:inviteId
  delete: async (workspaceSlug: string, inviteId: string): Promise<void> => {
    await api.delete(`/workspaces/${workspaceSlug}/invites/${inviteId}`);
  },

  // For invite acceptance page - get details 
  getDetails: async (inviteId: string): Promise<InviteDetails> => {
    const res = await api.get(`/invites/${inviteId}`);
    return res.data;
  },
};
