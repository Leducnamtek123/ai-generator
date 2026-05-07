"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  billingApi,
  type BillingCatalogResponse,
  type BillingDetails,
  type BillingPlanId,
} from "@/services/billingApi";
import { paymentApi, type PaymentProvider } from "@/services/paymentApi";
import { AxiosError } from "axios";
import {
  CreditCard,
  Users,
  Loader2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/ui/button";
import { toast } from "sonner";

export default function BillingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [billing, setBilling] = useState<BillingDetails | null>(null);
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    try {
      const [billingData, catalogData] = await Promise.all([
        billingApi.get(slug),
        billingApi.getCatalog(),
      ]);
      setBilling(billingData);
      setCatalog(catalogData);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message?.message ??
            err.response?.data?.message)
          : null;
      setError(
        typeof message === "string"
          ? message
          : "Failed to load billing details",
      );
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBilling();
    });
  }, [loadBilling]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const teamPlans =
    catalog?.teamPlans ??
    catalog?.plans?.filter((plan) => plan.segment === "team") ??
    [];

  const purchasePlan = async (
    planId: BillingPlanId,
    provider: PaymentProvider,
  ) => {
    if (!billing) return;

    try {
      setIsPaying(planId);
      const checkout = await paymentApi.checkout({
        purchaseType: "subscription",
        planId,
        provider,
        scopeType: "organization",
        scopeId: billing.organization.id,
        returnUri: `${window.location.pathname}${window.location.search}`,
      });

      if (!checkout.paymentUrl) {
        toast.error("Could not create payment URL");
        return;
      }

      window.location.assign(checkout.paymentUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(message);
    } finally {
      setIsPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <Link
          href={"/dashboard" as string}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Billing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Workspace billing for shared plans, shared wallet, and seat overage
          overview
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {billing && (
        <div className="space-y-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                Monthly Total
              </div>
              <div className="text-4xl font-bold tracking-tight">
                {formatCurrency(billing.total)}
              </div>
              <div className="text-sm text-white/60 mt-2">
                Plan price + seat overage
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                <Wallet className="w-4 h-4 text-blue-500" />
                Shared wallet
              </div>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-foreground">
                    {billing.wallet.totalCredits}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    remaining spendable credits
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Included
                    </p>
                    <p className="text-lg font-semibold">
                      {billing.wallet.includedCreditsRemaining}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Top-up
                    </p>
                    <p className="text-lg font-semibold">
                      {billing.wallet.topUpCreditsBalance}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
                <Users className="w-4 h-4 text-blue-500" />
                Seats
              </div>
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-foreground">
                    {billing.seats.amount}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(billing.seats.total)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {billing.seats.included} included, {billing.seats.overage}{" "}
                  overage billed at {formatCurrency(billing.seats.unit)}/seat
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Billing Breakdown
              </h3>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-muted-foreground">
                  Plan ({billing.plan?.name ?? "Trial"})
                </span>
                <span className="font-medium">
                  {formatCurrency(billing.plan?.priceVnd ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-muted-foreground">
                  Seats ({billing.seats.amount} - {billing.seats.included}{" "}
                  included)
                </span>
                <span className="font-medium">
                  {formatCurrency(billing.seats.total)}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-sm bg-muted/30">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  {formatCurrency(billing.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Workspace plans</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Shared credits and seat-based billing for workspaces.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {teamPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 space-y-3"
                >
                  <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspace plan
                  </span>
                  {plan.featured && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full">
                      Featured
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-2xl font-bold">{plan.priceLabel}</p>
                    </div>
                    {billing.plan?.id === plan.id && (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.monthlyCredits.toLocaleString()} credits included
                  </p>
                  <p className="text-sm text-muted-foreground leading-6">
                    {plan.summary}
                  </p>
                  <ul className="space-y-2 pt-1">
                    {plan.highlights.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground/85"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl bg-muted/40 border border-border p-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
                      Approximate usage
                    </p>
                    <div className="space-y-1 text-sm text-foreground/80">
                      {plan.usageExamples.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  </div>
                  {plan.trial ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Free trial on sign-up
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button
                        variant={plan.featured ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() => void purchasePlan(plan.id, "vnpay")}
                      >
                        {isPaying === plan.id ? "Processing..." : "VNPAY"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() => void purchasePlan(plan.id, "momo")}
                      >
                        MoMo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() => void purchasePlan(plan.id, "zalopay")}
                      >
                        ZaloPay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() => void purchasePlan(plan.id, "9pay")}
                      >
                        9Pay
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!billing && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No billing information available</p>
        </div>
      )}
    </div>
  );
}
