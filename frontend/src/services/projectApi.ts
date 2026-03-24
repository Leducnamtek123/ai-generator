import { api } from "@/lib/api";

export interface Project {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  ownerId?: number;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  url: string;
  description: string;
  organizationId?: string;
}

export interface UpdateProjectData {
  name?: string;
  url?: string;
  description?: string;
}

// Matches: Controller path 'projects', version '1'
// Note: Backend projects are NOT org-scoped in the URL,
// but use pagination and user-scoped access
export const projectApi = {
  // POST /projects
  create: async (data: CreateProjectData): Promise<{ project: Project }> => {
    const res = await api.post("/projects", data);
    return { project: res.data };
  },

  // GET /projects?page=1&limit=50
  list: async (
    page = 1,
    limit = 50
  ): Promise<{ data: Project[]; hasNextPage: boolean }> => {
    const res = await api.get("/projects", {
      params: { page, limit },
    });
    return res.data;
  },

  // GET /projects/:id
  get: async (id: string): Promise<Project> => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  // PATCH /projects/:id
  update: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data;
  },

  // DELETE /projects/:id
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
