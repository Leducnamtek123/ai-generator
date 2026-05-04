import { api } from '@/lib/api';

interface DashboardStats {
  totalWorkflows: number;
  totalProjects: number;
  creditBalance: number;
  recentWorkflows: any[];
}

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
};
