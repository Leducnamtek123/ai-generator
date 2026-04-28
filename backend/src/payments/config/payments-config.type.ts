export type PaymentProvider = 'vnpay' | 'momo' | 'zalopay';

export type PaymentsConfig = {
  defaultProvider: PaymentProvider;
  creditPackages: Record<string, { credits: number; amountVnd: number }>;
  returnPath: string;
  vnpay: {
    tmnCode?: string;
    hashSecret?: string;
    payUrl?: string;
    locale: string;
    orderType: string;
  };
  momo: {
    partnerCode?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;
    requestType: string;
    lang: string;
  };
  zalopay: {
    appId?: string;
    key1?: string;
    key2?: string;
    endpoint?: string;
  };
};
