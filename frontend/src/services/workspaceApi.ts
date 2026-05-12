import { api } from "@/lib/api";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  domain?: string;
  shouldAttachUsersByDomain: boolean;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  userId: number;
  role: string;
  user?: {
    id: number;
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  roles?: Array<{ role: string }>;
}

export interface Membership {
  member: Member;
  workspace: Workspace;
}

export type CreateWorkspaceData = {
  name: string;
  url: string;
  description: string;
  domain?: string;
  shouldAttachUsersByDomain?: boolean;
};

export type UpdateWorkspaceData = Partial<CreateWorkspaceData>;

export const workspaceApi = {
  // POST /workspaces
  create: async (data: CreateWorkspaceData): Promise<Workspace> => {
    const res = await api.post("/workspaces", data);
    return res.data;
  },

  // GET /workspaces
  list: async (): Promise<Workspace[]> => {
    const res = await api.get("/workspaces");
    return res.data;
  },

  // GET /workspaces/:slug
  get: async (slug: string): Promise<Workspace> => {
    const res = await api.get(`/workspaces/${slug}`);
    return res.data;
  },

  // GET /workspaces/:slug/membership
  getMembership: async (slug: string): Promise<Membership> => {
    const res = await api.get(`/workspaces/${slug}/membership`);
    return res.data;
  },

  // PATCH /workspaces/:slug
  update: async (slug: string, data: UpdateWorkspaceData): Promise<Workspace> => {
    const res = await api.patch(`/workspaces/${slug}`, data);
    return res.data;
  },

  // DELETE /workspaces/:slug
  delete: async (slug: string): Promise<void> => {
    await api.delete(`/workspaces/${slug}`);
  },

  // PATCH /workspaces/:slug/transfer
  transferOwnership: async (
    slug: string,
    data: { transferToUserId: string }
  ): Promise<void> => {
    await api.patch(`/workspaces/${slug}/transfer`, data);
  },
};
