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
import { VNPay } from 'vnpay';
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

  private getVnpayInstance() {
    const tmnCode = this.configService.get('payments.vnpay.tmnCode', {
      infer: true,
    });
    const hashSecret = this.configService.get('payments.vnpay.hashSecret', {
      infer: true,
    });
    const payUrl = this.configService.get('payments.vnpay.payUrl', {
      infer: true,
    });

    if (!tmnCode || !hashSecret) {
      throw new BadRequestException('VNPAY is not configured');
    }

    return new VNPay({
      tmnCode,
      secureSecret: hashSecret,
      vnpayHost: payUrl?.includes('http')
        ? new URL(payUrl).origin
        : 'https://sandbox.vnpayment.vn',
      testMode: true,
    });
  }

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
    let normalizedQuery = this.normalizePayload(query);
    
    // 9Pay return URL uses ?d=base64&s=signature
    if (provider === '9pay' && normalizedQuery.d && normalizedQuery.s) {
      const decodedData = this.decodeNinePayData(normalizedQuery.d);
      const verified = this.verifyNinePaySignature({
        d: normalizedQuery.d,
        s: normalizedQuery.s,
      });
      
      if (!verified) throw new BadRequestException('Invalid 9Pay signature');
      normalizedQuery = { ...normalizedQuery, ...decodedData };
    }

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
    if (provider === '9pay') {
      return this.handleNinePayIpn(normalizedPayload);
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
        return { paymentUrl: await this.createVnpayCheckoutUrl(order) };
      case 'momo':
        return this.createMomoCheckout(order);
      case 'zalopay':
        return this.createZaloPayCheckout(order);
      case '9pay':
        return this.createNinePayCheckout(order);
      default:
        throw new BadRequestException('Unsupported payment provider');
    }
  }

  private async createMomoCheckout(order: PaymentOrderEntity) {
    const partnerCode = this.configService.get('payments.momo.partnerCode', {
      infer: true,
    });
    const accessKey = this.configService.get('payments.momo.accessKey', {
      infer: true,
    });
    const secretKey = this.configService.get('payments.momo.secretKey', {
      infer: true,
    });
    const endpoint = this.configService.get('payments.momo.endpoint', {
      infer: true,
    });
    const requestType =
      this.configService.get('payments.momo.requestType', {
        infer: true,
      }) || 'captureWallet';
    const lang =
      this.configService.get('payments.momo.lang', {
        infer: true,
      }) || 'vi';

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
    const appIdRaw = this.configService.get('payments.zalopay.appId', {
      infer: true,
    });
    const key1 = this.configService.get('payments.zalopay.key1', {
      infer: true,
    });
    const endpoint = this.configService.get('payments.zalopay.endpoint', {
      infer: true,
    });

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

  private async createVnpayCheckoutUrl(order: PaymentOrderEntity) {
    const vnpay = this.getVnpayInstance();
    return vnpay.buildPaymentUrl({
      vnp_Amount: order.amountVnd,
      vnp_CreateDate: parseInt(this.formatDateYmdHis(new Date())),
      vnp_IpAddr: '127.0.0.1',
      vnp_OrderInfo: `Top up ${order.credits} credits`,
      vnp_OrderType: (this.configService.get('payments.vnpay.orderType', {
        infer: true,
      }) || 'other') as any,
      vnp_ReturnUrl: this.getProviderReturnUrl('vnpay'),
      vnp_TxnRef: order.orderCode,
    });
  }

  private verifyProviderReturn(
    provider: PaymentProvider,
    payload: Record<string, string>,
  ) {
    if (provider === 'vnpay') {
      try {
        const vnpay = this.getVnpayInstance();
        const verify = vnpay.verifyReturnUrl(payload as any);
        return verify.isSuccess;
      } catch {
        return false;
      }
    }

    if (provider === 'momo') {
      return this.verifyMomoSignature(payload);
    }

    if (provider === 'zalopay') {
      return this.verifyZaloPaySignature(payload);
    }

    if (provider === '9pay') {
      return this.verifyNinePaySignature(payload);
    }

    return false;
  }

  private verifyMomoSignature(payload: Record<string, string>) {
    const signature = payload.signature;
    if (!signature) return false;

    const accessKey = this.configService.get('payments.momo.accessKey', {
      infer: true,
    });
    const secretKey = this.configService.get('payments.momo.secretKey', {
      infer: true,
    });
    if (!accessKey || !secretKey) return false;

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
      const key2 = this.configService.get('payments.zalopay.key2', {
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
      case '9pay':
        return String(payload.status) === '1' ? 'paid' : 'failed';
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
    const appIdRaw = this.configService.get('payments.zalopay.appId', {
      infer: true,
    });
    const key1 = this.configService.get('payments.zalopay.key1', {
      infer: true,
    });
    const endpoint = this.configService.get('payments.zalopay.endpoint', {
      infer: true,
    });
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
      case '9pay':
        return payload.invoice_no || payload.orderId || payload.invoice;
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
    const packages = this.configService.get('payments.creditPackages', {
      infer: true,
    });
    if (!packages) throw new BadRequestException('Credit packages not configured');
    const paymentPackage = packages[packageId];
    if (!paymentPackage) throw new BadRequestException('Invalid package');
    return paymentPackage;
  }

  private resolveProvider(provider?: PaymentProvider): PaymentProvider {
    return (
      provider ||
      this.configService.get('payments.defaultProvider', {
        infer: true,
      }) ||
      'vnpay'
    );
  }

  private generateOrderCode(provider: PaymentProvider) {
    const random = crypto.randomBytes(4).toString('hex');
    return `${provider}_${Date.now()}_${random}`;
  }

  private getProviderReturnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.get('app.backendDomain', {
      infer: true,
    });
    const apiPrefix = this.configService.get('app.apiPrefix', {
      infer: true,
    });
    if (!backendDomain || !apiPrefix) {
      throw new BadRequestException('App backend domain or API prefix not configured');
    }
    return `${backendDomain}/${apiPrefix}/v1/payments/return/${provider}`;
  }

  private getProviderIpnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.get('app.backendDomain', {
      infer: true,
    });
    const apiPrefix = this.configService.get('app.apiPrefix', {
      infer: true,
    });
    if (!backendDomain || !apiPrefix) {
      throw new BadRequestException('App backend domain or API prefix not configured');
    }
    return `${backendDomain}/${apiPrefix}/v1/payments/ipn/${provider}`;
  }

  private getFrontendReturnUrl(
    provider: PaymentProvider,
    orderCode: string,
    status: PaymentOrderStatus,
  ) {
    const frontendDomain = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    const returnPath = this.configService.get('payments.returnPath', {
      infer: true,
    });
    if (!frontendDomain || !returnPath) {
      throw new BadRequestException('App frontend domain or return path not configured');
    }
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

  private async createNinePayCheckout(order: PaymentOrderEntity) {
    const merchantKey = this.configService.get('payments.ninepay.merchantKey', {
      infer: true,
    });
    const secretKey = this.configService.get('payments.ninepay.secretKey', {
      infer: true,
    });
    const endpoint = this.configService.get('payments.ninepay.endpoint', {
      infer: true,
    });

    if (!merchantKey || !secretKey || !endpoint) {
      throw new BadRequestException('9Pay is not configured');
    }

    const payload = {
      amount: order.amountVnd,
      back_url: this.getFrontendReturnUrl('9pay', order.orderCode, 'pending'),
      description: `AI Generator top up ${order.credits} credits`,
      invoice_no: order.orderCode,
      merchantKey: merchantKey,
      return_url: this.getProviderReturnUrl('9pay'),
      time: Math.floor(Date.now() / 1000),
    };

    // Sort keys alphabetically - 9Pay requires specific order for some versions
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((obj, key) => {
        obj[key] = payload[key];
        return obj;
      }, {});

    // Use JSON.stringify without extra spaces and encode to base64
    const message = Buffer.from(JSON.stringify(sortedPayload)).toString('base64');
    
    // Sign the base64 message directly using HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');

    const portalUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const paymentUrl = `${portalUrl}/portal?d=${encodeURIComponent(message)}&s=${signature}`;

    return {
      paymentUrl,
      metadata: {
        ninepayInvoice: payload.invoice_no,
      },
    };
  }

  private decodeNinePayData(base64Data: string) {
    try {
      return JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8'));
    } catch {
      return {};
    }
  }

  private verifyNinePaySignature(payload: Record<string, string>) {
    const secretKey = this.configService.get('payments.ninepay.secretKey', {
      infer: true,
    });
    if (!secretKey) return false;

    const { d: message, s: signature } = payload;
    if (!message || !signature) return false;

    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');

    return expected.toLowerCase() === signature.toLowerCase();
  }

  private async handleNinePayIpn(payload: Record<string, string>) {
    const checksumKey = this.configService.get('payments.ninepay.checksumKey', {
      infer: true,
    });
    if (!checksumKey) return { status: 0, message: '9Pay is not configured' };

    const resultStr = payload.result || '';
    const checksum = payload.checksum || '';

    if (!resultStr || !checksum) {
      return { status: 0, message: 'Invalid payload' };
    }

    const expectedChecksum = crypto
      .createHash('sha256')
      .update(resultStr + checksumKey)
      .digest('hex');
      
    if (expectedChecksum.toUpperCase() !== checksum.toUpperCase()) {
      return { status: 0, message: 'Invalid signature' };
    }

    let resultData: any;
    try {
      resultData = JSON.parse(
        Buffer.from(resultStr, 'base64').toString('utf-8'),
      );
    } catch {
      return { status: 0, message: 'Invalid result format' };
    }

    const orderCode = resultData.invoice_no || resultData.invoice;
    if (!orderCode) {
      return { status: 0, message: 'Order not found' };
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider: '9pay' },
    });
    
    if (!order) return { status: 0, message: 'Order not found' };

    const status =
      resultData.status === 1 || String(resultData.status) === '1'
        ? 'paid'
        : 'failed';

    const mergedPayload = { ...payload, ...resultData };
    await this.finalizeOrder(order, status, mergedPayload);

    return { status: 1, message: 'Success' };
  }
}
