import axios from 'axios';

export interface DashboardStats {
  totalWorkflows: number;
  totalProjects: number;
  creditBalance: number;
  recentWorkflows: any[];
}

export const dashboardApi = {
  getStats: async () => {
    const response = await axios.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },
};
