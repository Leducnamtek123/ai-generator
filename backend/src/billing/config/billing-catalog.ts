export type BillingScopeType = "user" | "organization";

export type BillingPlanType =
  | "trial"
  | "starter"
  | "pro"
  | "team"
  | "enterprise";

export type BillingPlanSegment = "individual" | "team";

export type BillingPlanCatalogItem = {
  id: BillingPlanType;
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
};

export type TopUpPackageCatalogItem = {
  id: string;
  name: string;
  summary: string;
  credits: number;
  priceVnd: number;
  priceLabel: string;
  highlights: string[];
  usageExamples: string[];
};

export type CreditCostGuideItem = {
  group: string;
  tools: string[];
  credits: number;
};

export const BILLING_PLAN_CATALOG: BillingPlanCatalogItem[] = [
  {
    id: "trial",
    segment: "individual",
    name: "Trial",
    summary: "For onboarding and quick evaluation before you pick a paid plan.",
    priceLabel: "Free",
    priceVnd: 0,
    monthlyCredits: 25,
    seatsIncluded: 1,
    trial: true,
    highlights: [
      "Full tool access with a small monthly wallet",
      "Best for testing the product flow",
      "No commitment, no workspace seats",
    ],
    usageExamples: [
      "25 image runs",
      "5 music runs",
      "1 short video + a few image edits",
    ],
    toolCoverage: [
      "Image tools",
      "Video tools",
      "Audio tools",
      "Workflow tools",
    ],
    ctaLabel: "Start free",
  },
  {
    id: "starter",
    segment: "individual",
    name: "Starter",
    summary:
      "For solo creators who need the full toolset with a modest monthly quota.",
    priceLabel: "149,000 VND",
    priceVnd: 149000,
    monthlyCredits: 300,
    seatsIncluded: 1,
    commercialUse: true,
    highlights: [
      "Full access to every tool in the app",
      "300 included credits every month",
      "Commercial usage allowed",
    ],
    usageExamples: [
      "150 image runs",
      "60 music runs",
      "30 video-heavy actions",
    ],
    toolCoverage: [
      "All creator tools",
      "Stock and workflow tools",
      "Community publishing tools",
    ],
    ctaLabel: "Choose Starter",
  },
  {
    id: "pro",
    segment: "individual",
    name: "Pro",
    summary:
      "For creators working daily who need a larger included wallet and priority handling.",
    priceLabel: "399,000 VND",
    priceVnd: 399000,
    monthlyCredits: 1200,
    seatsIncluded: 1,
    commercialUse: true,
    priority: true,
    featured: true,
    highlights: [
      "Everything in Starter",
      "1,200 included credits every month",
      "Priority queue for generation jobs",
    ],
    usageExamples: [
      "600 image runs",
      "240 music runs",
      "120 mixed image/video actions",
    ],
    toolCoverage: [
      "All creator tools",
      "Workflow editor and visual flow",
      "Community and publishing tools",
    ],
    ctaLabel: "Choose Pro",
  },
  {
    id: "team",
    segment: "team",
    name: "Workspace",
    summary:
      "For agencies and internal workspaces that need shared credits and permission control.",
    priceLabel: "999,000 VND",
    priceVnd: 999000,
    monthlyCredits: 3600,
    seatsIncluded: 5,
    commercialUse: true,
    sharedPool: true,
    priority: true,
    highlights: [
      "Shared credit pool across the workspace",
      "5 included seats with member billing roles",
      "Approval-friendly workspace workflow",
    ],
    usageExamples: [
      "1,800 image runs",
      "720 music runs",
      "360 mixed workspace actions",
    ],
    toolCoverage: [
      "All creator tools",
      "Workspace billing and member management",
      "Workspace-level usage visibility",
    ],
    ctaLabel: "Choose Workspace",
  },
  {
    id: "enterprise",
    segment: "team",
    name: "Enterprise",
    summary: "For large workspaces that need custom limits, seats, and support.",
    priceLabel: "Custom",
    priceVnd: 0,
    monthlyCredits: 9999,
    seatsIncluded: 0,
    commercialUse: true,
    sharedPool: true,
    priority: true,
    support: "Dedicated support and SLA",
    highlights: [
      "Custom credits and seat limits",
      "Custom billing and approval flows",
      "Dedicated support and SLA",
    ],
    usageExamples: [
      "Custom usage modeling",
      "Custom workflow packaging",
      "Volume-based rollout",
    ],
    toolCoverage: [
      "All creator tools",
      "Org workflows and governance",
      "Dedicated support onboarding",
    ],
    ctaLabel: "Contact sales",
  },
];

export const TOP_UP_CATALOG: TopUpPackageCatalogItem[] = [
  {
    id: "starter",
    name: "Starter top-up",
    summary: "Small bundle for one-off usage spikes.",
    credits: 100,
    priceVnd: 99000,
    priceLabel: "99,000 VND",
    highlights: [
      "100 extra credits",
      "Good for quick bursts",
      "Keeps your plan intact",
    ],
    usageExamples: [
      "100 image actions",
      "20 music actions",
      "20 short video actions",
    ],
  },
  {
    id: "pro",
    name: "Pro top-up",
    summary: "Best value for users who exceed their included quota.",
    credits: 500,
    priceVnd: 390000,
    priceLabel: "390,000 VND",
    highlights: [
      "500 extra credits",
      "Lower unit cost",
      "Works with any active plan",
    ],
    usageExamples: [
      "500 image actions",
      "100 music actions",
      "100 short video actions",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise top-up",
    summary: "Large bundle for workspaces with heavy throughput.",
    credits: 2000,
    priceVnd: 1290000,
    priceLabel: "1,290,000 VND",
    highlights: [
      "2,000 extra credits",
      "Best volume pricing",
      "Useful for campaign work",
    ],
    usageExamples: [
      "2,000 image actions",
      "400 music actions",
      "400 short video actions",
    ],
  },
];

export const CREDIT_COST_GUIDE: CreditCostGuideItem[] = [
  {
    group: "Image tools",
    tools: [
      "Image Generator",
      "Image Upscaler",
      "Background Remover",
      "Sketch to Image",
      "Variations",
      "Icon Generator",
      "Mockup Generator",
      "Skin Enhancer",
      "Voice Generator",
      "Sound Effect Generator",
    ],
    credits: 1,
  },
  {
    group: "Audio tools",
    tools: ["Music Generator"],
    credits: 2,
  },
  {
    group: "Video tools",
    tools: ["Lip Sync"],
    credits: 3,
  },
  {
    group: "Heavy video tools",
    tools: ["Video Generator", "Video Upscaler"],
    credits: 5,
  },
];

export const BILLING_PLAN_BY_ID = Object.fromEntries(
  BILLING_PLAN_CATALOG.map((plan) => [plan.id, plan]),
) as Record<BillingPlanType, BillingPlanCatalogItem>;

export const INDIVIDUAL_BILLING_PLAN_CATALOG = BILLING_PLAN_CATALOG.filter(
  (plan) => plan.segment === "individual",
);

export const TEAM_BILLING_PLAN_CATALOG = BILLING_PLAN_CATALOG.filter(
  (plan) => plan.segment === "team",
);

export const BILLING_PLAN_CATALOG_BY_SEGMENT: Record<
  BillingPlanSegment,
  BillingPlanCatalogItem[]
> = {
  individual: INDIVIDUAL_BILLING_PLAN_CATALOG,
  team: TEAM_BILLING_PLAN_CATALOG,
};

export const TOP_UP_BY_ID = Object.fromEntries(
  TOP_UP_CATALOG.map((bundle) => [bundle.id, bundle]),
) as Record<string, TopUpPackageCatalogItem>;
