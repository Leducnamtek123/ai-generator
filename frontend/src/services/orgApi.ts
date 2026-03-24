import { api } from "@/lib/api";

export interface Organization {
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
  organization: Organization;
}

export type CreateOrgData = {
  name: string;
  url: string;
  description: string;
  domain?: string;
  shouldAttachUsersByDomain?: boolean;
};

export type UpdateOrgData = Partial<CreateOrgData>;

// Matches: Controller path 'orgs', version '1'
// baseURL already includes /api/v1
export const orgApi = {
  // POST /orgs
  create: async (data: CreateOrgData): Promise<Organization> => {
    const res = await api.post("/orgs", data);
    return res.data;
  },

  // GET /orgs
  list: async (): Promise<Organization[]> => {
    const res = await api.get("/orgs");
    return res.data;
  },

  // GET /orgs/:slug
  get: async (slug: string): Promise<Organization> => {
    const res = await api.get(`/orgs/${slug}`);
    return res.data;
  },

  // GET /orgs/:slug/membership
  getMembership: async (slug: string): Promise<Membership> => {
    const res = await api.get(`/orgs/${slug}/membership`);
    return res.data;
  },

  // PATCH /orgs/:slug
  update: async (slug: string, data: UpdateOrgData): Promise<Organization> => {
    const res = await api.patch(`/orgs/${slug}`, data);
    return res.data;
  },

  // DELETE /orgs/:slug
  delete: async (slug: string): Promise<void> => {
    await api.delete(`/orgs/${slug}`);
  },

  // PATCH /orgs/:slug/transfer
  transferOwnership: async (
    slug: string,
    data: { transferToUserId: string }
  ): Promise<void> => {
    await api.patch(`/orgs/${slug}/transfer`, data);
  },
};
