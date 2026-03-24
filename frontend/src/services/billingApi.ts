import { api } from "@/lib/api";

export interface BillingDetails {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  seats: {
    amount: number;
    unit: number;
    total: number;
  };
  total: number;
}

// Matches: Controller path 'orgs/:orgSlug/billing', version '1'
export const billingApi = {
  // GET /orgs/:orgSlug/billing
  get: async (orgSlug: string): Promise<BillingDetails> => {
    const res = await api.get(`/orgs/${orgSlug}/billing`);
    return res.data;
  },
};
