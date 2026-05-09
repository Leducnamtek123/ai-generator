"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ArrowRight, Sparkles, Users, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";
import {
  billingApi,
  type BillingCatalogResponse,
  type BillingPlanCard,
} from "@/services/billingApi";

type PricingSegment = "individual" | "team";

const segmentMeta: Record<
  PricingSegment,
  { label: string; title: string; description: string }
> = {
  individual: {
    label: "Individual",
    title: "Personal billing",
    description: "One owner, one wallet, one clear monthly quota.",
  },
  team: {
    label: "Workspace",
    title: "Team billing",
    description: "Shared credits, included seats, and workspace controls.",
  },
};

const formatCredits = (value: number) => value.toLocaleString();

function PlanBadge({ plan, segment }: { plan: BillingPlanCard; segment: PricingSegment }) {
  const label = plan.trial
    ? "Free trial"
    : plan.featured
      ? segment === "individual"
        ? "Best value"
        : "Expert choice"
      : plan.priority
        ? "Priority"
        : plan.sharedPool
          ? "Shared pool"
          : plan.commercialUse
            ? "Commercial use"
            : null;

  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em]",
        plan.featured
          ? segment === "individual"
            ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
            : "border-violet-400/30 bg-violet-400/10 text-violet-200"
          : "border-white/10 bg-white/5 text-white/55",
      )}
    >
      {label}
    </span>
  );
}

function PlanCard({
  plan,
  segment,
}: {
  plan: BillingPlanCard;
  segment: PricingSegment;
}) {
  const annualizedCredits = plan.monthlyCredits * 12;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[2rem] border p-6",
        plan.featured
          ? segment === "individual"
            ? "border-sky-400/30 bg-sky-400/[0.08] shadow-[0_0_0_1px_rgba(56,189,248,0.12)]"
            : "border-violet-400/30 bg-violet-400/[0.08] shadow-[0_0_0_1px_rgba(167,139,250,0.12)]"
          : "border-white/8 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.28em] text-white/38 uppercase">
            {plan.name}
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.05em] uppercase">
            {plan.priceLabel}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{plan.summary}</p>
        </div>
        {plan.trial ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
            Starter
          </span>
        ) : (
          <PlanBadge plan={plan} segment={segment} />
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="text-[10px] font-semibold tracking-[0.28em] text-white/38 uppercase">
          Included credits
        </div>
        <div className="mt-2 text-lg font-bold">
          {formatCredits(plan.monthlyCredits)} / month
        </div>
        <div className="mt-1 text-sm text-white/58">
          {formatCredits(annualizedCredits)} credits/year equivalent
        </div>
        <div className="mt-1 text-sm text-white/58">
          {plan.seatsIncluded > 1
            ? `${plan.seatsIncluded} seats included`
            : "1 seat included"}
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {plan.highlights.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-white/72">
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="text-[10px] font-semibold tracking-[0.28em] text-white/38 uppercase">
          Approximate usage
        </div>
        <div className="mt-3 space-y-2 text-sm text-white/72">
          {plan.usageExamples.map((usage) => (
            <div key={usage}>{usage}</div>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <Button
          asChild
          className={cn(
            "h-12 w-full rounded-full font-bold",
            plan.featured
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/[0.08] text-white hover:bg-white/[0.12]",
          )}
        >
          <Link href="/sign-up">
            {plan.trial ? "Start free" : plan.ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function TopUpCard({
  name,
  summary,
  credits,
  priceLabel,
  highlights,
  usageExamples,
}: {
  name: string;
  summary: string;
  credits: number;
  priceLabel: string;
  highlights: string[];
  usageExamples: string[];
}) {
  return (
    <article className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold tracking-[-0.03em]">{name}</h4>
          <p className="mt-1 text-sm leading-6 text-white/56">{summary}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
          {formatCredits(credits)} credits
        </span>
      </div>

      <div className="mt-4 text-2xl font-black tracking-[-0.04em]">
        {priceLabel}
      </div>

      <ul className="mt-4 space-y-2">
        {highlights.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-white/72">
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="text-[10px] font-semibold tracking-[0.28em] text-white/38 uppercase">
          Typical usage
        </div>
        <div className="mt-2 space-y-1 text-sm text-white/72">
          {usageExamples.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function PricingShowcasePage() {
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<PricingSegment>("individual");

  useEffect(() => {
    let active = true;

    void billingApi
      .getCatalog()
      .then((response) => {
        if (active) {
          setCatalog(response);
        }
      })
      .catch(() => {
        if (active) {
          setCatalog(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const plans = useMemo(() => {
    const allPlans =
      catalog?.plans ?? [
        ...(catalog?.individualPlans ?? []),
        ...(catalog?.teamPlans ?? []),
      ];

    return segment === "individual"
      ? allPlans.filter((plan) => plan.segment === "individual")
      : allPlans.filter((plan) => plan.segment === "team");
  }, [catalog, segment]);

  const topUpPackages = catalog?.topUpPackages ?? [];
  const creditCostGuide = catalog?.creditCostGuide ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white selection:bg-sky-400/30 selection:text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="absolute top-[16rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.14]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/70 to-transparent" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <section className="space-y-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.28em] text-white/50 uppercase">
              <Sparkles className="size-3.5 text-sky-300" />
              Pricing
            </div>
            <h1 className="mt-5 text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.88] font-black tracking-[-0.08em] text-balance uppercase">
              Pick your way to create.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
              The pricing surface is split into personal and workspace plans so
              users can compare fast. Each card shows included credits, annual
              usage equivalent, and the add-ons that sit on top.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.34em] text-white/38 uppercase">
                  Plan type
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] uppercase">
                  Compare by billing scope
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
                  {segmentMeta[segment].title}: {segmentMeta[segment].description}
                </p>
              </div>

              <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] p-1">
                {(Object.keys(segmentMeta) as PricingSegment[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSegment(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase transition-colors",
                      segment === item
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white",
                    )}
                  >
                    {segmentMeta[item].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/58">
              <span className="inline-flex items-center gap-2">
                <Wallet className="size-4 text-sky-300" />
                Billed monthly
              </span>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-sky-300" />
                Segment-separated plans
              </span>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4 text-sky-300" />
                Top-ups do not change the subscription
              </span>
            </div>

            {loading ? (
              <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: segment === "individual" ? 3 : 2 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-[28rem] rounded-[2rem] border border-white/8 bg-white/[0.03]"
                    />
                  ),
                )}
              </div>
            ) : plans.length === 0 ? (
              <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 text-sm leading-7 text-white/58">
                Pricing data is temporarily unavailable. The billing catalog did
                not return any plans for this segment.
              </div>
            ) : (
              <div
                className={cn(
                  "mt-8 grid gap-4",
                  segment === "individual"
                    ? "lg:grid-cols-3"
                    : "lg:grid-cols-2",
                )}
              >
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} segment={segment} />
                ))}
              </div>
            )}
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.34em] text-white/38 uppercase">
                  Add-ons
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] uppercase">
                  Optional top-up credits
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-white/56">
                Top-ups are separate from the subscription plan. They are useful
                for bursts, one-off work, and overflow beyond the included
                wallet.
              </p>
            </div>

            {topUpPackages.length === 0 ? (
              <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 text-sm leading-7 text-white/58">
                Top-up packages are currently unavailable.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {topUpPackages.map((pack) => (
                  <TopUpCard key={pack.id} {...pack} />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold tracking-[0.34em] text-white/38 uppercase">
                Credit guide
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] uppercase">
                How the wallet is consumed
              </h2>
              {creditCostGuide.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/58">
                  Credit guidance is currently unavailable.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {creditCostGuide.map((item) => (
                    <div
                      key={item.group}
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{item.group}</span>
                        <span className="text-xs font-semibold tracking-[0.22em] text-sky-300 uppercase">
                          {formatCredits(item.credits)} credits
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/58">
                        {item.tools.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6">
              <div className="text-[11px] font-semibold tracking-[0.34em] text-white/38 uppercase">
                Why it helps
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] uppercase">
                Clearer than a single long plan table
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-white/70">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-300" />
                  Personal and workspace plans are split, so users do not need
                  to mentally subtract seats or shared wallets.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-300" />
                  Each card shows monthly credits and annualized usage
                  equivalent, which makes rough cost planning faster.
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-300" />
                  Top-ups remain separate from subscriptions, so a user can
                  scale without changing their base plan.
                </li>
              </ul>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
