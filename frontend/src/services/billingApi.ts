import { api } from "@/lib/api";

export type BillingScopeType = "user" | "organization";
export type BillingPlanSegment = "individual" | "team";

export type BillingPlanId = "trial" | "starter" | "pro" | "team" | "enterprise";
export type TopUpPackageId = "starter" | "pro" | "enterprise";

export interface BillingPlanCard {
  id: BillingPlanId;
  segment: BillingPlanSegment;
  name: string;
  summary: string;
  priceLabel: string;
  priceVnd: number;
  monthlyCredits: number;
  seatsIncluded: number;
  featured?: boolean;
  trial?: boolean;
  commercialUse?: boolean;
  sharedPool?: boolean;
  priority?: boolean;
  support?: string;
  highlights: string[];
  usageExamples: string[];
  toolCoverage: string[];
  ctaLabel: string;
}

export interface TopUpPackageCard {
  id: TopUpPackageId;
  name: string;
  summary: string;
  credits: number;
  priceVnd: number;
  priceLabel: string;
  highlights: string[];
  usageExamples: string[];
}

export interface CreditCostGuideItem {
  group: string;
  tools: string[];
  credits: number;
}

export interface BillingCatalogResponse {
  plans: BillingPlanCard[];
  individualPlans: BillingPlanCard[];
  teamPlans: BillingPlanCard[];
  topUpPackages: TopUpPackageCard[];
  creditCostGuide: CreditCostGuideItem[];
}

export interface BillingWalletSummary {
  scopeType: BillingScopeType;
  scopeId: string;
  plan: BillingPlanCard | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "free";
  includedCreditsGranted: number;
  includedCreditsRemaining: number;
  topUpCreditsPurchased: number;
  topUpCreditsBalance: number;
  totalCredits: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  renewalAt: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BillingDetails {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: BillingPlanCard | null;
  wallet: BillingWalletSummary;
  seats: {
    amount: number;
    included: number;
    overage: number;
    unit: number;
    total: number;
  };
  total: number;
}

export const billingApi = {
  getCatalog: async (): Promise<BillingCatalogResponse> => {
    const res = await api.get("/plans");
    return res.data;
  },
  getMe: async (): Promise<BillingWalletSummary> => {
    const res = await api.get("/billing/me");
    return res.data;
  },
  get: async (orgSlug: string): Promise<BillingDetails> => {
    const res = await api.get(`/orgs/${orgSlug}/billing`);
    return res.data;
  },
};
