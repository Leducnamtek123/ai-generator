import { post, get } from '@/lib/api';

export type PaymentProvider = 'vnpay' | 'momo' | 'zalopay' | '9pay';
export type CreditPackageId = 'starter' | 'pro' | 'enterprise';

type CheckoutResponse = {
  orderCode: string;
  provider: PaymentProvider;
  amountVnd: number;
  credits: number;
  paymentUrl: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
};

type PaymentOrder = {
  id: string;
  userId: string;
  provider: PaymentProvider;
  orderCode: string;
  credits: number;
  amountVnd: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export const paymentApi = {
  checkout: (payload: {
    packageId: CreditPackageId;
    provider: PaymentProvider;
    returnUri?: string;
  }) => post<CheckoutResponse, typeof payload>('/payments/checkout', payload),
  getStatus: (orderCode: string) =>
    get<PaymentOrder>(`/payments/status/${orderCode}`),
};
