import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { AllConfigType } from '../config/config.type';
import { CreditsService } from '../credits/credits.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentProvider } from './config/payments-config.type';
import {
  PaymentOrderEntity,
  PaymentOrderStatus,
} from './infrastructure/persistence/relational/entities/payment-order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepository: Repository<PaymentOrderEntity>,
    private readonly creditsService: CreditsService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const provider = this.resolveProvider(dto.provider);
    const paymentPackage = this.getPackage(dto.packageId);
    const orderCode = this.generateOrderCode(provider);

    const order = await this.paymentOrderRepository.save(
      this.paymentOrderRepository.create({
        userId: String(userId),
        provider,
        orderCode,
        credits: paymentPackage.credits,
        amountVnd: paymentPackage.amountVnd,
        status: 'pending',
        metadata: {
          packageId: dto.packageId,
          returnUri: dto.returnUri || null,
        },
      }),
    );

    const checkout = await this.createProviderCheckout(order);
    order.paymentUrl = checkout.paymentUrl;
    order.metadata = {
      ...(order.metadata || {}),
      ...(checkout.metadata || {}),
    };
    await this.paymentOrderRepository.save(order);

    return {
      orderCode: order.orderCode,
      provider,
      amountVnd: order.amountVnd,
      credits: order.credits,
      paymentUrl: checkout.paymentUrl,
      status: order.status,
    };
  }

  async getOrder(orderCode: string, userId: string) {
    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, userId: String(userId) },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async handleReturn(
    provider: PaymentProvider,
    query: Record<string, string | string[]>,
  ) {
    const normalizedQuery = this.normalizePayload(query);
    const orderCode = this.extractOrderCode(provider, normalizedQuery);
    if (!orderCode) throw new BadRequestException('Missing order code');

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider },
    });
    if (!order) throw new NotFoundException('Order not found');

    const verified = this.verifyProviderReturn(provider, normalizedQuery);
    const status = await this.mapProviderStatus(
      provider,
      normalizedQuery,
      verified,
      order,
    );

    await this.finalizeOrder(order, status, normalizedQuery);

    return { orderCode, status, verified, provider };
  }

  async handleIpn(
    provider: PaymentProvider,
    payload: Record<string, string | string[]>,
  ) {
    const normalizedPayload = this.normalizePayload(payload);

    if (provider === 'zalopay') {
      return this.handleZaloPayCallback(normalizedPayload);
    }

    const orderCode = this.extractOrderCode(provider, normalizedPayload);
    if (!orderCode) {
      return this.buildIpnResponse(provider, false, 'Order not found');
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider },
    });
    if (!order) {
      return this.buildIpnResponse(provider, false, 'Order not found');
    }

    const verified = this.verifyProviderReturn(provider, normalizedPayload);
    if (!verified) {
      return this.buildIpnResponse(provider, false, 'Invalid signature');
    }

    const status = await this.mapProviderStatus(
      provider,
      normalizedPayload,
      true,
      order,
    );
    await this.finalizeOrder(order, status, normalizedPayload);

    return this.buildIpnResponse(provider, true, 'Confirm success');
  }

  private async createProviderCheckout(
    order: PaymentOrderEntity,
  ): Promise<{ paymentUrl: string; metadata?: Record<string, unknown> }> {
    switch (order.provider) {
      case 'vnpay':
        return { paymentUrl: this.createVnpayCheckoutUrl(order) };
      case 'momo':
        return this.createMomoCheckout(order);
      case 'zalopay':
        return this.createZaloPayCheckout(order);
      default:
        throw new BadRequestException('Unsupported payment provider');
    }
  }

  private async createMomoCheckout(order: PaymentOrderEntity) {
    const partnerCode = this.configService.getOrThrow(
      'payments.momo.partnerCode',
      {
        infer: true,
      },
    );
    const accessKey = this.configService.getOrThrow('payments.momo.accessKey', {
      infer: true,
    });
    const secretKey = this.configService.getOrThrow('payments.momo.secretKey', {
      infer: true,
    });
    const endpoint = this.configService.getOrThrow('payments.momo.endpoint', {
      infer: true,
    });
    const requestType = this.configService.getOrThrow(
      'payments.momo.requestType',
      {
        infer: true,
      },
    );
    const lang = this.configService.getOrThrow('payments.momo.lang', {
      infer: true,
    });

    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      throw new BadRequestException('MoMo is not configured');
    }

    const requestId = order.orderCode;
    const extraData = Buffer.from(
      JSON.stringify({ orderCode: order.orderCode }),
      'utf-8',
    ).toString('base64');

    const payload: Record<string, string | number | boolean> = {
      partnerCode,
      partnerName: 'AI Generator',
      storeId: 'AI Generator',
      requestId,
      amount: order.amountVnd,
      orderId: order.orderCode,
      orderInfo: `Top up ${order.credits} credits`,
      redirectUrl: this.getProviderReturnUrl('momo'),
      ipnUrl: this.getProviderIpnUrl('momo'),
      requestType,
      lang,
      autoCapture: true,
      extraData,
    };

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${payload.amount}` +
      `&extraData=${payload.extraData}` +
      `&ipnUrl=${payload.ipnUrl}` +
      `&orderId=${payload.orderId}` +
      `&orderInfo=${payload.orderInfo}` +
      `&partnerCode=${payload.partnerCode}` +
      `&redirectUrl=${payload.redirectUrl}` +
      `&requestId=${payload.requestId}` +
      `&requestType=${payload.requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const response = await axios.post(
      endpoint,
      { ...payload, signature },
      { timeout: 20000 },
    );

    const data = response.data as Record<string, any>;
    const payUrl =
      String(data.payUrl || '') ||
      String(data.deeplink || '') ||
      String(data.qrCodeUrl || '');

    if (!payUrl) {
      throw new BadRequestException(
        `MoMo checkout failed: ${String(data.message || 'missing payUrl')}`,
      );
    }

    return {
      paymentUrl: payUrl,
      metadata: {
        momoRequestId: requestId,
        momoResultCode: data.resultCode,
      },
    };
  }

  private async createZaloPayCheckout(order: PaymentOrderEntity) {
    const appIdRaw = this.configService.getOrThrow('payments.zalopay.appId', {
      infer: true,
    });
    const key1 = this.configService.getOrThrow('payments.zalopay.key1', {
      infer: true,
    });
    const endpoint = this.configService.getOrThrow(
      'payments.zalopay.endpoint',
      {
        infer: true,
      },
    );

    if (!appIdRaw || !key1 || !endpoint) {
      throw new BadRequestException('ZaloPay is not configured');
    }

    const appId = Number(appIdRaw);
    if (Number.isNaN(appId)) {
      throw new BadRequestException('ZaloPay appId is invalid');
    }

    const appTransId = `${this.formatDateYYMMDD()}_${order.orderCode}`;
    const appTime = Date.now();
    const appUser = order.userId;
    const amount = order.amountVnd;
    const item = '[]';
    const embedData = JSON.stringify({
      redirecturl: this.getFrontendReturnUrl(
        'zalopay',
        order.orderCode,
        'pending',
      ),
    });
    const description = `AI Generator top up ${order.credits} credits`;
    const callbackUrl = this.getProviderIpnUrl('zalopay');

    const macData = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
    const mac = crypto.createHmac('sha256', key1).update(macData).digest('hex');

    const form = new URLSearchParams({
      app_id: String(appId),
      app_user: appUser,
      app_trans_id: appTransId,
      app_time: String(appTime),
      amount: String(amount),
      item,
      embed_data: embedData,
      description,
      callback_url: callbackUrl,
      mac,
    });

    const response = await axios.post(endpoint, form.toString(), {
      timeout: 20000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const data = response.data as Record<string, any>;
    const orderUrl = String(data.order_url || '');
    if (!orderUrl) {
      throw new BadRequestException(
        `ZaloPay checkout failed: ${String(data.return_message || 'missing order_url')}`,
      );
    }

    return {
      paymentUrl: orderUrl,
      metadata: {
        zaloAppTransId: appTransId,
        zaloReturnCode: data.return_code,
      },
    };
  }

  private createVnpayCheckoutUrl(order: PaymentOrderEntity) {
    const tmnCode = this.configService.getOrThrow('payments.vnpay.tmnCode', {
      infer: true,
    });
    const hashSecret = this.configService.getOrThrow(
      'payments.vnpay.hashSecret',
      {
        infer: true,
      },
    );
    const payUrl = this.configService.getOrThrow('payments.vnpay.payUrl', {
      infer: true,
    });

    if (!tmnCode || !hashSecret || !payUrl) {
      throw new BadRequestException('VNPAY is not configured');
    }

    const queryData: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(order.amountVnd * 100),
      vnp_CreateDate: this.formatDateYmdHis(new Date()),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: this.configService.getOrThrow('payments.vnpay.locale', {
        infer: true,
      }),
      vnp_OrderInfo: `Top up ${order.credits} credits`,
      vnp_OrderType: this.configService.getOrThrow('payments.vnpay.orderType', {
        infer: true,
      }),
      vnp_ReturnUrl: this.getProviderReturnUrl('vnpay'),
      vnp_TxnRef: order.orderCode,
    };

    const signedQuery = this.createVnpaySignature(queryData, hashSecret);
    return `${payUrl}?${signedQuery}`;
  }

  private verifyProviderReturn(
    provider: PaymentProvider,
    payload: Record<string, string>,
  ) {
    if (provider === 'vnpay') {
      const secureHash = payload.vnp_SecureHash;
      if (!secureHash) return false;
      const hashSecret = this.configService.getOrThrow(
        'payments.vnpay.hashSecret',
        {
          infer: true,
        },
      );
      const payloadToVerify = { ...payload };
      delete payloadToVerify.vnp_SecureHash;
      delete payloadToVerify.vnp_SecureHashType;
      const calculatedHash = this.calculateVnpayHash(
        payloadToVerify,
        hashSecret,
      );
      return secureHash === calculatedHash;
    }

    if (provider === 'momo') {
      return this.verifyMomoSignature(payload);
    }

    if (provider === 'zalopay') {
      return this.verifyZaloPaySignature(payload);
    }

    return false;
  }

  private verifyMomoSignature(payload: Record<string, string>) {
    const signature = payload.signature;
    if (!signature) return false;

    const accessKey = this.configService.getOrThrow('payments.momo.accessKey', {
      infer: true,
    });
    const secretKey = this.configService.getOrThrow('payments.momo.secretKey', {
      infer: true,
    });

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${payload.amount || ''}` +
      `&extraData=${payload.extraData || ''}` +
      `&message=${payload.message || ''}` +
      `&orderId=${payload.orderId || ''}` +
      `&orderInfo=${payload.orderInfo || ''}` +
      `&orderType=${payload.orderType || ''}` +
      `&partnerCode=${payload.partnerCode || ''}` +
      `&payType=${payload.payType || ''}` +
      `&requestId=${payload.requestId || ''}` +
      `&responseTime=${payload.responseTime || ''}` +
      `&resultCode=${payload.resultCode || ''}` +
      `&transId=${payload.transId || ''}`;

    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === expected;
  }

  private verifyZaloPaySignature(payload: Record<string, string>) {
    if (payload.data && payload.mac) {
      const key2 = this.configService.getOrThrow('payments.zalopay.key2', {
        infer: true,
      });
      if (!key2) return false;
      const expectedMac = crypto
        .createHmac('sha256', key2)
        .update(payload.data)
        .digest('hex');
      return expectedMac === payload.mac;
    }
    return true;
  }

  private async mapProviderStatus(
    provider: PaymentProvider,
    payload: Record<string, string>,
    verified: boolean,
    order: PaymentOrderEntity,
  ): Promise<PaymentOrderStatus> {
    if (!verified) return 'failed';

    switch (provider) {
      case 'vnpay':
        return payload.vnp_ResponseCode === '00' ? 'paid' : 'failed';
      case 'momo':
        return Number(payload.resultCode) === 0 ? 'paid' : 'failed';
      case 'zalopay':
        return this.resolveZaloPayStatus(payload, order);
      default:
        return 'failed';
    }
  }

  private async resolveZaloPayStatus(
    payload: Record<string, string>,
    order: PaymentOrderEntity,
  ): Promise<PaymentOrderStatus> {
    if (payload.data) return 'paid';

    const appTransId =
      this.readZaloAppTransId(payload) ||
      String((order.metadata || {}).zaloAppTransId || '');
    if (!appTransId) return 'pending';

    const status = await this.queryZaloPayOrder(appTransId);
    if (status === 'paid') return 'paid';
    if (status === 'failed') return 'failed';
    return 'pending';
  }

  private async queryZaloPayOrder(appTransId: string) {
    const appIdRaw = this.configService.getOrThrow('payments.zalopay.appId', {
      infer: true,
    });
    const key1 = this.configService.getOrThrow('payments.zalopay.key1', {
      infer: true,
    });
    const endpoint = this.configService.getOrThrow(
      'payments.zalopay.endpoint',
      {
        infer: true,
      },
    );
    const appId = Number(appIdRaw);
    if (!appId || !key1 || !endpoint) return 'pending';

    const queryEndpoint = endpoint.replace('/v2/create', '/v2/query');
    const macData = `${appId}|${appTransId}|${key1}`;
    const mac = crypto.createHmac('sha256', key1).update(macData).digest('hex');
    const form = new URLSearchParams({
      app_id: String(appId),
      app_trans_id: appTransId,
      mac,
    });

    const response = await axios.post(queryEndpoint, form.toString(), {
      timeout: 15000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const data = response.data as Record<string, any>;

    // ZaloPay query API commonly returns:
    // 1: paid, 2: failed/cancelled, 3: processing
    if (Number(data.return_code) === 1) return 'paid';
    if (Number(data.return_code) === 2) return 'failed';
    return 'pending';
  }

  private async finalizeOrder(
    order: PaymentOrderEntity,
    status: PaymentOrderStatus,
    payload: Record<string, string>,
  ) {
    if (order.status === 'paid') return order;

    order.status = status;
    order.callbackPayload = payload;
    if (status === 'paid') {
      order.paidAt = new Date();
      order.providerTxnRef =
        payload.vnp_TransactionNo ||
        payload.transId ||
        payload.zp_trans_id ||
        null;
      await this.creditsService.create({
        userId: order.userId,
        amount: order.credits,
        type: 'topup',
        metadata: {
          paymentProvider: order.provider,
          orderCode: order.orderCode,
          amountVnd: order.amountVnd,
          providerTxnRef: order.providerTxnRef,
          raw: payload,
        },
      });
    }

    return this.paymentOrderRepository.save(order);
  }

  private async handleZaloPayCallback(payload: Record<string, string>) {
    const orderCode = this.extractOrderCode('zalopay', payload);
    if (!orderCode) {
      return { return_code: 2, return_message: 'Order not found' };
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider: 'zalopay' },
    });
    if (!order) return { return_code: 2, return_message: 'Order not found' };

    const verified = this.verifyZaloPaySignature(payload);
    if (!verified) {
      return { return_code: 2, return_message: 'Invalid signature' };
    }

    const status = await this.mapProviderStatus(
      'zalopay',
      payload,
      true,
      order,
    );
    await this.finalizeOrder(order, status, payload);

    return { return_code: 1, return_message: 'Success' };
  }

  private buildIpnResponse(
    provider: PaymentProvider,
    ok: boolean,
    message: string,
  ) {
    if (provider === 'vnpay') {
      return {
        RspCode: ok ? '00' : '97',
        Message: message,
      };
    }
    if (provider === 'momo') {
      return {
        resultCode: ok ? 0 : 1001,
        message,
      };
    }
    return {
      return_code: ok ? 1 : 2,
      return_message: message,
    };
  }

  private extractOrderCode(
    provider: PaymentProvider,
    payload: Record<string, string>,
  ) {
    switch (provider) {
      case 'vnpay':
        return payload.vnp_TxnRef;
      case 'momo':
        return payload.orderId || payload.orderCode;
      case 'zalopay': {
        const appTransId = this.readZaloAppTransId(payload);
        if (!appTransId) return payload.paymentOrder || '';
        const index = appTransId.indexOf('_');
        return index >= 0 ? appTransId.slice(index + 1) : appTransId;
      }
      default:
        return '';
    }
  }

  private readZaloAppTransId(payload: Record<string, string>) {
    if (payload.app_trans_id) return payload.app_trans_id;
    if (payload.apptransid) return payload.apptransid;
    if (payload.data) {
      try {
        const parsed = JSON.parse(payload.data) as Record<string, any>;
        return String(parsed.app_trans_id || '');
      } catch {
        return '';
      }
    }
    return '';
  }

  private normalizePayload(payload: Record<string, string | string[]>) {
    return Object.entries(payload).reduce<Record<string, string>>(
      (acc, [k, v]) => {
        acc[k] = Array.isArray(v) ? String(v[0]) : String(v);
        return acc;
      },
      {},
    );
  }

  private getPackage(packageId: string) {
    const packages = this.configService.getOrThrow('payments.creditPackages', {
      infer: true,
    });
    const paymentPackage = packages[packageId];
    if (!paymentPackage) throw new BadRequestException('Invalid package');
    return paymentPackage;
  }

  private resolveProvider(provider?: PaymentProvider): PaymentProvider {
    return (
      provider ||
      this.configService.getOrThrow('payments.defaultProvider', {
        infer: true,
      })
    );
  }

  private generateOrderCode(provider: PaymentProvider) {
    const random = crypto.randomBytes(4).toString('hex');
    return `${provider}_${Date.now()}_${random}`;
  }

  private getProviderReturnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.getOrThrow('app.backendDomain', {
      infer: true,
    });
    const apiPrefix = this.configService.getOrThrow('app.apiPrefix', {
      infer: true,
    });
    return `${backendDomain}/${apiPrefix}/v1/payments/return/${provider}`;
  }

  private getProviderIpnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.getOrThrow('app.backendDomain', {
      infer: true,
    });
    const apiPrefix = this.configService.getOrThrow('app.apiPrefix', {
      infer: true,
    });
    return `${backendDomain}/${apiPrefix}/v1/payments/ipn/${provider}`;
  }

  private getFrontendReturnUrl(
    provider: PaymentProvider,
    orderCode: string,
    status: PaymentOrderStatus,
  ) {
    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
    const returnPath = this.configService.getOrThrow('payments.returnPath', {
      infer: true,
    });
    const url = new URL(returnPath, frontendDomain);
    url.searchParams.set('paymentProvider', provider);
    url.searchParams.set('paymentOrder', orderCode);
    url.searchParams.set('paymentStatus', status);
    return url.toString();
  }

  private createVnpaySignature(data: Record<string, string>, secret: string) {
    const sorted = Object.keys(data)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = data[key];
        return result;
      }, {});
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sorted)) params.append(k, v);
    const signData = params.toString();
    const hash = crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
    params.append('vnp_SecureHash', hash);
    return params.toString();
  }

  private calculateVnpayHash(data: Record<string, string>, secret: string) {
    const sorted = Object.keys(data)
      .sort()
      .reduce<Record<string, string>>((result, key) => {
        result[key] = data[key];
        return result;
      }, {});
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sorted)) params.append(k, v);
    const signData = params.toString();
    return crypto
      .createHmac('sha512', secret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
  }

  private formatDateYmdHis(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, '0');
    const dd = `${date.getDate()}`.padStart(2, '0');
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mi = `${date.getMinutes()}`.padStart(2, '0');
    const ss = `${date.getSeconds()}`.padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }

  private formatDateYYMMDD() {
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }
}
