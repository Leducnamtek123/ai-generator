import { registerAs } from '@nestjs/config';
import { IsIn, IsOptional, IsString } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { PaymentProvider, PaymentsConfig } from './payments-config.type';

class EnvironmentVariablesValidator {
  @IsIn(['vnpay', 'momo', 'zalopay', '9pay'])
  @IsOptional()
  PAYMENT_DEFAULT_PROVIDER: PaymentProvider;

  @IsString()
  @IsOptional()
  PAYMENT_RETURN_PATH: string;

  @IsString()
  @IsOptional()
  VNPAY_TMN_CODE: string;

  @IsString()
  @IsOptional()
  VNPAY_HASH_SECRET: string;

  @IsString()
  @IsOptional()
  VNPAY_PAY_URL: string;

  @IsString()
  @IsOptional()
  VNPAY_LOCALE: string;

  @IsString()
  @IsOptional()
  VNPAY_ORDER_TYPE: string;

  @IsString()
  @IsOptional()
  MOMO_PARTNER_CODE: string;

  @IsString()
  @IsOptional()
  MOMO_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  MOMO_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  MOMO_ENDPOINT: string;

  @IsString()
  @IsOptional()
  MOMO_REQUEST_TYPE: string;

  @IsString()
  @IsOptional()
  MOMO_LANG: string;

  @IsString()
  @IsOptional()
  ZALOPAY_APP_ID: string;

  @IsString()
  @IsOptional()
  ZALOPAY_KEY1: string;

  @IsString()
  @IsOptional()
  ZALOPAY_KEY2: string;

  @IsString()
  @IsOptional()
  ZALOPAY_ENDPOINT: string;

  @IsString()
  @IsOptional()
  NINEPAY_MERCHANT_KEY: string;

  @IsString()
  @IsOptional()
  NINEPAY_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  NINEPAY_CHECKSUM_KEY: string;

  @IsString()
  @IsOptional()
  NINEPAY_ENDPOINT: string;
}

export default registerAs<PaymentsConfig>('payments', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    defaultProvider: (process.env.PAYMENT_DEFAULT_PROVIDER ??
      'vnpay') as PaymentProvider,
    returnPath: process.env.PAYMENT_RETURN_PATH ?? '/settings?tab=billing',
    creditPackages: {
      starter: { credits: 100, amountVnd: 99000 },
      pro: { credits: 500, amountVnd: 390000 },
      enterprise: { credits: 2000, amountVnd: 1290000 },
    },
    vnpay: {
      tmnCode: process.env.VNPAY_TMN_CODE,
      hashSecret: process.env.VNPAY_HASH_SECRET,
      payUrl:
        process.env.VNPAY_PAY_URL ??
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      locale: process.env.VNPAY_LOCALE ?? 'vn',
      orderType: process.env.VNPAY_ORDER_TYPE ?? 'other',
    },
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE,
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      endpoint:
        process.env.MOMO_ENDPOINT ??
        'https://test-payment.momo.vn/v2/gateway/api/create',
      requestType: process.env.MOMO_REQUEST_TYPE ?? 'captureWallet',
      lang: process.env.MOMO_LANG ?? 'vi',
    },
    zalopay: {
      appId: process.env.ZALOPAY_APP_ID,
      key1: process.env.ZALOPAY_KEY1,
      key2: process.env.ZALOPAY_KEY2,
      endpoint:
        process.env.ZALOPAY_ENDPOINT ??
        'https://sb-openapi.zalopay.vn/v2/create',
    },
    ninepay: {
      merchantKey: process.env.NINEPAY_MERCHANT_KEY,
      secretKey: process.env.NINEPAY_SECRET_KEY,
      checksumKey: process.env.NINEPAY_CHECKSUM_KEY,
      endpoint:
        process.env.NINEPAY_ENDPOINT ?? 'https://sand-payment.9pay.vn',
    },
  };
});
