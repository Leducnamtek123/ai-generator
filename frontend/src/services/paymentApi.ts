import { post, get } from "@/lib/api";
import type { BillingPlanId, TopUpPackageId } from "@/services/billingApi";

export type PaymentProvider = "vnpay" | "momo" | "zalopay" | "9pay";
export type PaymentPurchaseType = "subscription" | "topup";

type CheckoutResponse = {
  orderCode: string;
  provider: PaymentProvider;
  purchaseType: PaymentPurchaseType;
  planId: BillingPlanId | null;
  topUpPackageId: TopUpPackageId | null;
  scopeType: "user" | "organization";
  scopeId: string | null;
  amountVnd: number;
  credits: number;
  paymentUrl: string;
  status: "pending" | "paid" | "failed" | "cancelled";
};

type PaymentOrder = {
  id: string;
  userId: string;
  provider: PaymentProvider;
  purchaseType: PaymentPurchaseType;
  orderCode: string;
  planId: BillingPlanId | null;
  topUpPackageId: TopUpPackageId | null;
  scopeType: "user" | "organization";
  scopeId: string | null;
  credits: number;
  amountVnd: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export const paymentApi = {
  checkout: (payload: {
    purchaseType: PaymentPurchaseType;
    provider: PaymentProvider;
    planId?: BillingPlanId;
    topUpPackageId?: TopUpPackageId;
    packageId?: TopUpPackageId;
    scopeType?: "user" | "organization";
    scopeId?: string;
    returnUri?: string;
  }) => post<CheckoutResponse, typeof payload>("/payments/checkout", payload),
  getStatus: (orderCode: string) =>
    get<PaymentOrder>(`/payments/status/${orderCode}`),
};
