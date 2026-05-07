import { api } from '@/lib/api';

export type ApiKey = {
  id: string;
  key: string;
  keyPrefix?: string;
  keyLast4?: string;
  rawKey?: string | null;
  keyPreview?: string | null;
  name: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export const developerApi = {
  getKeys: async (): Promise<ApiKey[]> => {
    const response = await api.get<ApiKey[] | ApiKey>('/api-keys');
    const data = response.data;

    // Keep compatibility with list and single-item responses.
    return Array.isArray(data) ? data : data ? [data] : [];
  },

  generateKey: async (name: string): Promise<ApiKey> => {
    const response = await api.post<ApiKey>('/api-keys', { name });
    return response.data;
  },

  revokeKey: async (id: string): Promise<void> => {
    await api.delete(`/api-keys/${id}`);
  },
};
