import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { DataSource, Repository } from "typeorm";
import * as crypto from "crypto";
import axios from "axios";
import { AllConfigType } from "../config/config.type";
import { CreditsService } from "../credits/credits.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { VNPay } from "vnpay";
import { PaymentProvider } from "./config/payments-config.type";
import {
  BILLING_PLAN_BY_ID,
  TOP_UP_CATALOG,
  TOP_UP_BY_ID,
  BillingPlanCatalogItem,
  BillingPlanType,
  BillingPlanSegment,
} from "../billing/config/billing-catalog";
import { BillingAccountEntity } from "../billing-accounts/infrastructure/persistence/relational/entities/billing-account.entity";
import { CreditTransactionEntity } from "../credits/infrastructure/persistence/relational/entities/credit-transaction.entity";
import {
  PaymentOrderEntity,
  PaymentOrderStatus,
} from "./infrastructure/persistence/relational/entities/payment-order.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationCategory } from "../notifications/notifications.types";
import { NotificationType } from "../notifications/infrastructure/persistence/relational/entities/notification.entity";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentOrderEntity)
    private readonly paymentOrderRepository: Repository<PaymentOrderEntity>,
    private readonly creditsService: CreditsService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getVnpayInstance() {
    const tmnCode = this.configService.get("payments.vnpay.tmnCode", {
      infer: true,
    });
    const hashSecret = this.configService.get("payments.vnpay.hashSecret", {
      infer: true,
    });
    const payUrl = this.configService.get("payments.vnpay.payUrl", {
      infer: true,
    });

    if (!tmnCode || !hashSecret) {
      throw new BadRequestException("VNPAY is not configured");
    }

    return new VNPay({
      tmnCode,
      secureSecret: hashSecret,
      vnpayHost: payUrl?.includes("http")
        ? new URL(payUrl).origin
        : "https://sandbox.vnpayment.vn",
      testMode: true,
    });
  }

  async createCheckout(
    userId: string,
    dto: CreateCheckoutDto,
    clientIp?: string,
  ) {
    const provider = this.resolveProvider(dto.provider);
    const purchaseType =
      dto.purchaseType || (dto.planId ? "subscription" : "topup");
    const scopeType = dto.scopeType || "user";
    const scopeId = dto.scopeId || String(userId);
    const plan =
      purchaseType === "subscription" ? this.getPlan(dto.planId) : null;
    if (plan?.trial) {
      throw new BadRequestException("Trial plan is not purchasable");
    }
    this.ensurePlanScope(plan, scopeType);
    const topUpPackage =
      purchaseType === "topup"
        ? this.getTopUpPackage(dto.topUpPackageId || dto.packageId)
        : null;
    const orderCode = this.generateOrderCode(provider);
    const credits = plan ? plan.monthlyCredits : topUpPackage?.credits || 0;
    const amountVnd = plan ? plan.priceVnd : topUpPackage?.priceVnd || 0;
    const planId = plan ? plan.id : null;
    const topUpPackageId = topUpPackage ? topUpPackage.id : null;

    const order = await this.paymentOrderRepository.save(
      this.paymentOrderRepository.create({
        userId: String(userId),
        provider,
        purchaseType,
        orderCode,
        planId,
        topUpPackageId,
        scopeType,
        scopeId,
        credits,
        amountVnd,
        status: "pending",
        metadata: {
          purchaseType,
          planId,
          topUpPackageId,
          scopeType,
          scopeId,
          returnUri: dto.returnUri || null,
        },
      }),
    );

    const checkout = await this.createProviderCheckout(order, clientIp);
    order.paymentUrl = checkout.paymentUrl;
    order.metadata = {
      ...(order.metadata || {}),
      ...(checkout.metadata || {}),
    };
    await this.paymentOrderRepository.save(order);

    return {
      orderCode: order.orderCode,
      provider,
      purchaseType: order.purchaseType,
      planId: order.planId,
      topUpPackageId: order.topUpPackageId,
      scopeType: order.scopeType,
      scopeId: order.scopeId,
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
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async handleReturn(
    provider: PaymentProvider,
    query: Record<string, string | string[]>,
  ) {
    let normalizedQuery = this.normalizePayload(query);

    if (provider === "9pay") {
      const verified = this.verifyNinePayCallback(normalizedQuery);
      if (!verified) {
        throw new BadRequestException("Invalid 9Pay signature");
      }
      normalizedQuery = this.normalizeNinePayCallback(normalizedQuery);
    }

    const orderCode = this.extractOrderCode(provider, normalizedQuery);
    if (!orderCode) throw new BadRequestException("Missing order code");

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider },
    });
    if (!order) throw new NotFoundException("Order not found");

    const verified = this.verifyProviderReturn(provider, normalizedQuery);
    const status = await this.mapProviderStatus(
      provider,
      normalizedQuery,
      verified,
      order,
    );

    await this.finalizeOrder(order, status, normalizedQuery);

    return {
      orderCode,
      status,
      verified,
      provider,
      redirectUrl: this.buildFrontendReturnUrl(
        order,
        provider,
        status,
        verified,
      ),
    };
  }

  async handleIpn(
    provider: PaymentProvider,
    payload: Record<string, string | string[]>,
  ) {
    const normalizedPayload = this.normalizePayload(payload);

    if (provider === "zalopay") {
      return this.handleZaloPayCallback(normalizedPayload);
    }
    if (provider === "9pay") {
      return this.handleNinePayIpn(normalizedPayload);
    }

    const orderCode = this.extractOrderCode(provider, normalizedPayload);
    if (!orderCode) {
      return this.buildIpnResponse(provider, false, "Order not found");
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider },
    });
    if (!order) {
      return this.buildIpnResponse(provider, false, "Order not found");
    }

    const verified = this.verifyProviderReturn(provider, normalizedPayload);
    if (!verified) {
      return this.buildIpnResponse(provider, false, "Invalid signature");
    }

    const status = await this.mapProviderStatus(
      provider,
      normalizedPayload,
      true,
      order,
    );
    await this.finalizeOrder(order, status, normalizedPayload);

    return this.buildIpnResponse(provider, true, "Confirm success");
  }

  private async createProviderCheckout(
    order: PaymentOrderEntity,
    clientIp?: string,
  ): Promise<{ paymentUrl: string; metadata?: Record<string, unknown> }> {
    switch (order.provider) {
      case "vnpay":
        return { paymentUrl: await this.createVnpayCheckoutUrl(order) };
      case "momo":
        return this.createMomoCheckout(order);
      case "zalopay":
        return this.createZaloPayCheckout(order);
      case "9pay":
        return this.createNinePayCheckout(order, clientIp);
      default:
        throw new BadRequestException("Unsupported payment provider");
    }
  }

  private async createMomoCheckout(order: PaymentOrderEntity) {
    const partnerCode = this.configService.get("payments.momo.partnerCode", {
      infer: true,
    });
    const accessKey = this.configService.get("payments.momo.accessKey", {
      infer: true,
    });
    const secretKey = this.configService.get("payments.momo.secretKey", {
      infer: true,
    });
    const endpoint = this.configService.get("payments.momo.endpoint", {
      infer: true,
    });
    const requestType =
      this.configService.get("payments.momo.requestType", {
        infer: true,
      }) || "captureWallet";
    const lang =
      this.configService.get("payments.momo.lang", {
        infer: true,
      }) || "vi";

    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      throw new BadRequestException("MoMo is not configured");
    }

    const requestId = order.orderCode;
    const extraData = Buffer.from(
      JSON.stringify({ orderCode: order.orderCode }),
      "utf-8",
    ).toString("base64");

    const payload: Record<string, string | number | boolean> = {
      partnerCode,
      partnerName: "AI Generator",
      storeId: "AI Generator",
      requestId,
      amount: order.amountVnd,
      orderId: order.orderCode,
      orderInfo: this.getOrderInfo(order),
      redirectUrl: this.getProviderReturnUrl("momo"),
      ipnUrl: this.getProviderIpnUrl("momo"),
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
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const response = await axios.post(
      endpoint,
      { ...payload, signature },
      { timeout: 20000 },
    );

    const data = response.data as Record<string, any>;
    const payUrl =
      String(data.payUrl || "") ||
      String(data.deeplink || "") ||
      String(data.qrCodeUrl || "");

    if (!payUrl) {
      throw new BadRequestException(
        `MoMo checkout failed: ${String(data.message || "missing payUrl")}`,
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
    const appIdRaw = this.configService.get("payments.zalopay.appId", {
      infer: true,
    });
    const key1 = this.configService.get("payments.zalopay.key1", {
      infer: true,
    });
    const endpoint = this.configService.get("payments.zalopay.endpoint", {
      infer: true,
    });

    if (!appIdRaw || !key1 || !endpoint) {
      throw new BadRequestException("ZaloPay is not configured");
    }

    const appId = Number(appIdRaw);
    if (Number.isNaN(appId)) {
      throw new BadRequestException("ZaloPay appId is invalid");
    }

    const appTransId = `${this.formatDateYYMMDD()}_${order.orderCode}`;
    const appTime = Date.now();
    const appUser = order.userId;
    const amount = order.amountVnd;
    const item = "[]";
    const embedData = JSON.stringify({
      redirecturl: this.getFrontendReturnUrl(
        "zalopay",
        order.orderCode,
        "pending",
      ),
    });
    const description = this.getOrderInfo(order);
    const callbackUrl = this.getProviderIpnUrl("zalopay");

    const macData = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
    const mac = crypto.createHmac("sha256", key1).update(macData).digest("hex");

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
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = response.data as Record<string, any>;
    const orderUrl = String(data.order_url || "");
    if (!orderUrl) {
      throw new BadRequestException(
        `ZaloPay checkout failed: ${String(data.return_message || "missing order_url")}`,
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
      vnp_IpAddr: "127.0.0.1",
      vnp_OrderInfo: this.getOrderInfo(order),
      vnp_OrderType: (this.configService.get("payments.vnpay.orderType", {
        infer: true,
      }) || "other") as any,
      vnp_ReturnUrl: this.getProviderReturnUrl("vnpay"),
      vnp_TxnRef: order.orderCode,
    });
  }

  private verifyProviderReturn(
    provider: PaymentProvider,
    payload: Record<string, string>,
  ) {
    if (provider === "vnpay") {
      try {
        const vnpay = this.getVnpayInstance();
        const verify = vnpay.verifyReturnUrl(payload as any);
        return verify.isSuccess;
      } catch {
        return false;
      }
    }

    if (provider === "momo") {
      return this.verifyMomoSignature(payload);
    }

    if (provider === "zalopay") {
      return this.verifyZaloPaySignature(payload);
    }

    if (provider === "9pay") {
      return this.verifyNinePayCallback(payload);
    }

    return false;
  }

  private verifyMomoSignature(payload: Record<string, string>) {
    const signature = payload.signature;
    if (!signature) return false;

    const accessKey = this.configService.get("payments.momo.accessKey", {
      infer: true,
    });
    const secretKey = this.configService.get("payments.momo.secretKey", {
      infer: true,
    });
    if (!accessKey || !secretKey) return false;

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${payload.amount || ""}` +
      `&extraData=${payload.extraData || ""}` +
      `&message=${payload.message || ""}` +
      `&orderId=${payload.orderId || ""}` +
      `&orderInfo=${payload.orderInfo || ""}` +
      `&orderType=${payload.orderType || ""}` +
      `&partnerCode=${payload.partnerCode || ""}` +
      `&payType=${payload.payType || ""}` +
      `&requestId=${payload.requestId || ""}` +
      `&responseTime=${payload.responseTime || ""}` +
      `&resultCode=${payload.resultCode || ""}` +
      `&transId=${payload.transId || ""}`;

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    return signature === expected;
  }

  private verifyZaloPaySignature(payload: Record<string, string>) {
    if (payload.data && payload.mac) {
      const key2 = this.configService.get("payments.zalopay.key2", {
        infer: true,
      });
      if (!key2) return false;
      const expectedMac = crypto
        .createHmac("sha256", key2)
        .update(payload.data)
        .digest("hex");
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
    if (!verified) return "failed";

    switch (provider) {
      case "vnpay":
        return payload.vnp_ResponseCode === "00" ? "paid" : "failed";
      case "momo":
        return Number(payload.resultCode) === 0 ? "paid" : "failed";
      case "zalopay":
        return this.resolveZaloPayStatus(payload, order);
      case "9pay":
        return ["4", "5"].includes(String(payload.status)) ? "paid" : "failed";
      default:
        return "failed";
    }
  }

  private async resolveZaloPayStatus(
    payload: Record<string, string>,
    order: PaymentOrderEntity,
  ): Promise<PaymentOrderStatus> {
    if (payload.data) return "paid";

    const appTransId =
      this.readZaloAppTransId(payload) ||
      String((order.metadata || {}).zaloAppTransId || "");
    if (!appTransId) return "pending";

    const status = await this.queryZaloPayOrder(appTransId);
    if (status === "paid") return "paid";
    if (status === "failed") return "failed";
    return "pending";
  }

  private async queryZaloPayOrder(appTransId: string) {
    const appIdRaw = this.configService.get("payments.zalopay.appId", {
      infer: true,
    });
    const key1 = this.configService.get("payments.zalopay.key1", {
      infer: true,
    });
    const endpoint = this.configService.get("payments.zalopay.endpoint", {
      infer: true,
    });
    const appId = Number(appIdRaw);
    if (!appId || !key1 || !endpoint) return "pending";

    const queryEndpoint = endpoint.replace("/v2/create", "/v2/query");
    const macData = `${appId}|${appTransId}|${key1}`;
    const mac = crypto.createHmac("sha256", key1).update(macData).digest("hex");
    const form = new URLSearchParams({
      app_id: String(appId),
      app_trans_id: appTransId,
      mac,
    });

    const response = await axios.post(queryEndpoint, form.toString(), {
      timeout: 15000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = response.data as Record<string, any>;

    // ZaloPay query API commonly returns:
    // 1: paid, 2: failed/cancelled, 3: processing
    if (Number(data.return_code) === 1) return "paid";
    if (Number(data.return_code) === 2) return "failed";
    return "pending";
  }

  private async finalizeOrder(
    order: PaymentOrderEntity,
    status: PaymentOrderStatus,
    payload: Record<string, string>,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(PaymentOrderEntity);
      const lockedOrder = await orderRepository
        .createQueryBuilder("paymentOrder")
        .setLock("pessimistic_write")
        .where("paymentOrder.id = :id", { id: order.id })
        .getOne();

      if (!lockedOrder) {
        throw new NotFoundException("Order not found");
      }

      if (lockedOrder.status === status && status !== "pending") {
        return { order: lockedOrder, updated: false };
      }

      lockedOrder.status = status;
      lockedOrder.callbackPayload = payload;

      if (status === "paid") {
        lockedOrder.paidAt = lockedOrder.paidAt || new Date();
        lockedOrder.providerTxnRef =
          lockedOrder.providerTxnRef ||
          payload.vnp_TransactionNo ||
          payload.transId ||
          payload.zp_trans_id ||
          null;

        const paymentContext = this.buildPaymentContext(lockedOrder, payload);
        await this.applyPaidOrderTransaction(manager, lockedOrder, paymentContext);
      }

      return {
        order: await orderRepository.save(lockedOrder),
        updated: true,
      };
    });

    const savedOrder = result.order;
    if (!result.updated) {
      return savedOrder;
    }

    if (status === "paid") {
      try {
        await this.notificationsService.notifyUser({
          userId: Number(savedOrder.userId),
          category: NotificationCategory.PAYMENT,
          type: NotificationType.SUCCESS,
          title: "Payment completed",
          message: `${savedOrder.provider.toUpperCase()} payment ${savedOrder.orderCode} was completed and your credits were updated.`,
          emailSubject: `Payment completed for ${savedOrder.orderCode}`,
        });
      } catch (error) {
        this.logger.warn(
          `Payment notification failed for ${savedOrder.orderCode}: ${this.describeError(error)}`,
        );
      }
    } else if (status === "failed") {
      try {
        await this.notificationsService.notifyUser({
          userId: Number(savedOrder.userId),
          category: NotificationCategory.PAYMENT,
          type: NotificationType.ERROR,
          title: "Payment failed",
          message: `${savedOrder.provider.toUpperCase()} payment ${savedOrder.orderCode} did not complete. No credits were added.`,
          emailSubject: `Payment failed for ${savedOrder.orderCode}`,
        });
      } catch (error) {
        this.logger.warn(
          `Payment notification failed for ${savedOrder.orderCode}: ${this.describeError(error)}`,
        );
      }
    }

    return savedOrder;
  }

  private buildPaymentContext(
    order: PaymentOrderEntity,
    payload: Record<string, string>,
  ) {
    const scopeType = order.scopeType || "user";
    const scopeId = order.scopeId || order.userId;
    return {
      scopeType,
      scopeId,
      providerTxnRef:
        order.providerTxnRef ||
        payload.vnp_TransactionNo ||
        payload.transId ||
        payload.zp_trans_id ||
        null,
      renewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      metadata: {
        paymentProvider: order.provider,
        orderCode: order.orderCode,
        amountVnd: order.amountVnd,
        providerTxnRef:
          order.providerTxnRef ||
          payload.vnp_TransactionNo ||
          payload.transId ||
          payload.zp_trans_id ||
          null,
        raw: payload,
      },
    };
  }

  private async applyPaidOrderTransaction(
    manager: any,
    order: PaymentOrderEntity,
    context: ReturnType<typeof this.buildPaymentContext>,
  ) {
    const billingAccountRepository = manager.getRepository(BillingAccountEntity);
    const creditTransactionRepository = manager.getRepository(
      CreditTransactionEntity,
    );
    const billingAccount = await this.getOrCreateBillingAccount(
      billingAccountRepository,
      context.scopeType,
      context.scopeId,
    );

    if (order.purchaseType === "subscription") {
      billingAccount.currentPlanId = (order.planId || "starter") as BillingPlanType;
      billingAccount.status =
        billingAccount.currentPlanId === "trial" ? "trialing" : "active";
      billingAccount.includedCreditsGranted = order.credits;
      billingAccount.includedCreditsRemaining = order.credits;
      billingAccount.currentPeriodStart = new Date();
      billingAccount.currentPeriodEnd = context.renewalAt;
      billingAccount.renewalAt = context.renewalAt;
      billingAccount.metadata = {
        ...(billingAccount.metadata || {}),
        ...context.metadata,
        lastGrantType: "subscription",
        purchaseType: "subscription",
        renewalAt: context.renewalAt,
      };
    } else {
      billingAccount.topUpCreditsPurchased += order.credits;
      billingAccount.topUpCreditsBalance += order.credits;
      billingAccount.metadata = {
        ...(billingAccount.metadata || {}),
        ...context.metadata,
        lastGrantType: "topup",
        purchaseType: "topup",
      };
    }

    await billingAccountRepository.save(billingAccount);

    await creditTransactionRepository.save(
      creditTransactionRepository.create({
        userId: order.userId,
        scopeType: context.scopeType,
        scopeId: context.scopeId,
        amount: order.credits,
        type: order.purchaseType === "subscription" ? "grant" : "topup",
        status: "posted",
        referenceType: "payment_order",
        referenceId: order.orderCode,
        metadata: {
          ...context.metadata,
          purchaseType: order.purchaseType,
          scopeType: context.scopeType,
          scopeId: context.scopeId,
          renewalAt:
            order.purchaseType === "subscription" ? context.renewalAt : null,
        },
      }),
    );
  }

  private async getOrCreateBillingAccount(
    billingAccountRepository: Repository<BillingAccountEntity>,
    scopeType: string,
    scopeId: string,
  ) {
    let billingAccount = await billingAccountRepository
      .createQueryBuilder("billingAccount")
      .setLock("pessimistic_write")
      .where("billingAccount.scopeType = :scopeType", { scopeType })
      .andWhere("billingAccount.scopeId = :scopeId", { scopeId })
      .getOne();

    if (billingAccount) {
      return billingAccount;
    }

    billingAccount = billingAccountRepository.create({
      scopeType: scopeType as any,
      scopeId,
      status: "free",
      currentPlanId: null,
      includedCreditsGranted: 0,
      includedCreditsRemaining: 0,
      topUpCreditsPurchased: 0,
      topUpCreditsBalance: 0,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewalAt: null,
      metadata: null,
    });

    try {
      return await billingAccountRepository.save(billingAccount);
    } catch (error) {
      if (!this.isUniqueConstraintViolation(error)) {
        throw error;
      }

      const existingBillingAccount = await billingAccountRepository
        .createQueryBuilder("billingAccount")
        .setLock("pessimistic_write")
        .where("billingAccount.scopeType = :scopeType", { scopeType })
        .andWhere("billingAccount.scopeId = :scopeId", { scopeId })
        .getOne();

      if (!existingBillingAccount) {
        throw error;
      }

      return existingBillingAccount;
    }
  }

  private isUniqueConstraintViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  }

  private describeError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private async handleZaloPayCallback(payload: Record<string, string>) {
    const orderCode = this.extractOrderCode("zalopay", payload);
    if (!orderCode) {
      return { return_code: 2, return_message: "Order not found" };
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider: "zalopay" },
    });
    if (!order) return { return_code: 2, return_message: "Order not found" };

    const verified = this.verifyZaloPaySignature(payload);
    if (!verified) {
      return { return_code: 2, return_message: "Invalid signature" };
    }

    const status = await this.mapProviderStatus(
      "zalopay",
      payload,
      true,
      order,
    );
    await this.finalizeOrder(order, status, payload);

    return { return_code: 1, return_message: "Success" };
  }

  private buildIpnResponse(
    provider: PaymentProvider,
    ok: boolean,
    message: string,
  ) {
    if (provider === "vnpay") {
      return {
        RspCode: ok ? "00" : "97",
        Message: message,
      };
    }
    if (provider === "momo") {
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
      case "vnpay":
        return payload.vnp_TxnRef;
      case "momo":
        return payload.orderId || payload.orderCode;
      case "9pay":
        return (
          payload.invoice_no ||
          payload.request_code ||
          payload.orderId ||
          payload.invoice
        );
      case "zalopay": {
        const appTransId = this.readZaloAppTransId(payload);
        if (!appTransId) return payload.paymentOrder || "";
        const index = appTransId.indexOf("_");
        return index >= 0 ? appTransId.slice(index + 1) : appTransId;
      }
      default:
        return "";
    }
  }

  private readZaloAppTransId(payload: Record<string, string>) {
    if (payload.app_trans_id) return payload.app_trans_id;
    if (payload.apptransid) return payload.apptransid;
    if (payload.data) {
      try {
        const parsed = JSON.parse(payload.data) as Record<string, any>;
        return String(parsed.app_trans_id || "");
      } catch {
        return "";
      }
    }
    return "";
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

  private getPlan(planId?: string) {
    const resolvedPlanId = (planId || "starter") as BillingPlanType;
    const plan = BILLING_PLAN_BY_ID[resolvedPlanId];
    if (!plan) {
      throw new BadRequestException("Invalid plan");
    }
    return plan;
  }

  private ensurePlanScope(
    plan: BillingPlanCatalogItem | null,
    scopeType: "user" | "organization",
  ) {
    if (!plan) return;

    const expectedScope: Record<BillingPlanSegment, "user" | "organization"> = {
      individual: "user",
      team: "organization",
    };

    const allowedScope = expectedScope[plan.segment];
    if (scopeType !== allowedScope) {
      throw new BadRequestException(
        plan.segment === "team"
          ? "Team plans require organization billing"
          : "Individual plans require user billing",
      );
    }
  }

  private getTopUpPackage(packageId?: string) {
    const resolvedPackageId = packageId || "starter";
    const paymentPackage =
      TOP_UP_BY_ID[resolvedPackageId] ||
      TOP_UP_CATALOG.find((item) => item.id === resolvedPackageId);
    if (!paymentPackage) throw new BadRequestException("Invalid package");
    return paymentPackage;
  }

  private getOrderInfo(order: PaymentOrderEntity) {
    if (order.purchaseType === "subscription") {
      const plan = order.planId
        ? BILLING_PLAN_BY_ID[order.planId as BillingPlanType]
        : null;
      return plan ? `Subscribe to ${plan.name}` : "Subscribe to plan";
    }

    const topUp =
      (order.topUpPackageId && TOP_UP_BY_ID[order.topUpPackageId]) ||
      TOP_UP_BY_ID.starter;
    return topUp
      ? `Top up ${topUp.credits} credits`
      : `Top up ${order.credits} credits`;
  }

  private resolveProvider(provider?: PaymentProvider): PaymentProvider {
    return (
      provider ||
      this.configService.get("payments.defaultProvider", {
        infer: true,
      }) ||
      "vnpay"
    );
  }

  private generateOrderCode(provider: PaymentProvider) {
    const random = crypto.randomBytes(4).toString("hex");
    const timestamp = Date.now().toString(36);
    // 9Pay requires alphanumeric invoice_no (no underscores)
    return `${provider}${timestamp}${random}`.toUpperCase();
  }

  private getProviderReturnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.get("app.backendDomain", {
      infer: true,
    });
    const apiPrefix = this.configService.get("app.apiPrefix", {
      infer: true,
    });
    if (!backendDomain || !apiPrefix) {
      throw new BadRequestException(
        "App backend domain or API prefix not configured",
      );
    }
    return `${backendDomain}/${apiPrefix}/v1/payments/return/${provider}`;
  }

  private getProviderIpnUrl(provider: PaymentProvider) {
    const backendDomain = this.configService.get("app.backendDomain", {
      infer: true,
    });
    const apiPrefix = this.configService.get("app.apiPrefix", {
      infer: true,
    });
    if (!backendDomain || !apiPrefix) {
      throw new BadRequestException(
        "App backend domain or API prefix not configured",
      );
    }
    return `${backendDomain}/${apiPrefix}/v1/payments/ipn/${provider}`;
  }

  private getFrontendReturnUrl(
    provider: PaymentProvider,
    orderCode: string,
    status: PaymentOrderStatus,
  ) {
    const frontendDomain = this.configService.get("app.frontendDomain", {
      infer: true,
    });
    const returnPath = this.configService.get("payments.returnPath", {
      infer: true,
    });
    if (!frontendDomain || !returnPath) {
      throw new BadRequestException(
        "App frontend domain or return path not configured",
      );
    }
    const url = new URL(returnPath, frontendDomain);
    url.searchParams.set("paymentProvider", provider);
    url.searchParams.set("paymentOrder", orderCode);
    url.searchParams.set("paymentStatus", status);
    return url.toString();
  }

  private buildFrontendReturnUrl(
    order: PaymentOrderEntity,
    provider: PaymentProvider,
    status: PaymentOrderStatus,
    verified: boolean,
  ) {
    const frontendDomain = this.configService.get("app.frontendDomain", {
      infer: true,
    });
    const defaultReturnPath = this.configService.get("payments.returnPath", {
      infer: true,
    });
    if (!frontendDomain || !defaultReturnPath) {
      throw new BadRequestException(
        "App frontend domain or return path not configured",
      );
    }

    const metadata = (order.metadata || {}) as Record<string, unknown>;
    const returnUri =
      typeof metadata.returnUri === "string" && metadata.returnUri.trim()
        ? metadata.returnUri.trim()
        : defaultReturnPath;

    const url = new URL(
      this.normalizeReturnUri(returnUri, frontendDomain, defaultReturnPath),
      frontendDomain,
    );
    url.searchParams.set("paymentProvider", provider);
    url.searchParams.set("paymentOrder", order.orderCode);
    url.searchParams.set("paymentStatus", status);
    url.searchParams.set("paymentVerified", String(verified));
    return url.toString();
  }

  private normalizeReturnUri(
    returnUri: string,
    frontendDomain: string,
    defaultReturnPath: string,
  ) {
    const trimmed = returnUri.trim();
    if (!trimmed || trimmed.startsWith("//")) {
      return defaultReturnPath;
    }

    try {
      const parsed = new URL(trimmed);

      if (
        parsed.protocol === "javascript:" ||
        parsed.protocol === "data:" ||
        parsed.protocol === "vbscript:"
      ) {
        return defaultReturnPath;
      }

      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const frontendOrigin = new URL(frontendDomain).origin;
        return parsed.origin === frontendOrigin
          ? parsed.toString()
          : defaultReturnPath;
      }

      return parsed.toString();
    } catch {
      return trimmed;
    }
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
      .createHmac("sha512", secret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");
    params.append("vnp_SecureHash", hash);
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
      .createHmac("sha512", secret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");
  }

  private formatDateYmdHis(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    const hh = `${date.getHours()}`.padStart(2, "0");
    const mi = `${date.getMinutes()}`.padStart(2, "0");
    const ss = `${date.getSeconds()}`.padStart(2, "0");
    return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
  }

  private formatDateYYMMDD() {
    const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const yy = String(now.getUTCFullYear()).slice(-2);
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  }

  private async createNinePayCheckout(
    order: PaymentOrderEntity,
    clientIp?: string,
  ) {
    const merchantKey = this.configService.get("payments.ninepay.merchantKey", {
      infer: true,
    });
    const secretKey = this.configService.get("payments.ninepay.secretKey", {
      infer: true,
    });
    const endpoint = this.configService.get("payments.ninepay.endpoint", {
      infer: true,
    });
    const returnUrl =
      this.configService.get("payments.ninepay.returnUrl", {
        infer: true,
      }) || this.getProviderReturnUrl("9pay");

    if (!merchantKey || !secretKey || !endpoint) {
      throw new BadRequestException("9Pay is not configured");
    }

    const requestedAt = String(Math.floor(Date.now() / 1000));
    const checkoutPayload = {
      merchantKey,
      time: requestedAt,
      invoice_no: order.orderCode,
      amount: Math.round(order.amountVnd),
      currency: "VND",
      description: this.getOrderInfo(order),
      back_url: returnUrl,
      return_url: returnUrl,
      lang: "vi",
      ...(clientIp ? { client_ip: clientIp } : {}),
    };

    const checkoutJson = JSON.stringify(checkoutPayload);
    const baseEncode = Buffer.from(checkoutJson, "utf8").toString("base64");
    const endpointBase = endpoint.replace(/\/$/, "");
    const checkoutPath = this.resolveNinePayCheckoutPath(endpointBase);
    const xForwardUrl = `${endpointBase}/payments/create`;
    const canonicalParams = Object.entries(checkoutPayload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([key, value]) =>
          `${this.phpUrlEncode(key)}=${this.phpUrlEncode(value)}`,
      )
      .join("&");

    const message = ["POST", xForwardUrl, requestedAt, canonicalParams].join(
      "\n",
    );
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(message, "utf8")
      .digest("base64");

    return {
      paymentUrl: `${endpointBase}${checkoutPath}?${new URLSearchParams({
        baseEncode,
        signature,
      }).toString()}`,
      metadata: {
        ninepayInvoice: checkoutPayload.invoice_no,
        ninepayRequestCode: order.orderCode,
        ninepayCheckoutPath: checkoutPath,
      },
    };
  }

  private resolveNinePayCheckoutPath(endpointBase: string) {
    if (
      /sand-payment\.9pay\.vn|dev-payment\.9pay\.mobi|gc-dev-payment\.9pay\.mobi/i.test(
        endpointBase,
      )
    ) {
      return "/portal/create/order";
    }

    return "/portal";
  }

  private phpUrlEncode(value: string | number | boolean) {
    return encodeURIComponent(String(value)).replace(/%20/g, "+");
  }

  private decodeNinePayData(base64Data: string) {
    try {
      return JSON.parse(Buffer.from(base64Data, "base64").toString("utf-8"));
    } catch {
      return {};
    }
  }

  private verifyNinePayCallback(payload: Record<string, string>) {
    if (payload.result && payload.checksum) {
      const checksumKey = this.configService.get(
        "payments.ninepay.checksumKey",
        {
          infer: true,
        },
      );
      if (!checksumKey) return false;

      const expectedChecksum = crypto
        .createHash("sha256")
        .update(payload.result + checksumKey)
        .digest("hex");

      return expectedChecksum.toUpperCase() === payload.checksum.toUpperCase();
    }

    if ((payload.baseEncode && payload.signature) || (payload.d && payload.s)) {
      return this.verifyLegacyNinePaySignature(payload);
    }

    return false;
  }

  private normalizeNinePayCallback(payload: Record<string, string>) {
    if (!payload.result) {
      if (!payload.d) {
        return payload;
      }
      const decoded = this.decodeNinePayData(payload.d);
      return { ...payload, ...decoded };
    }

    const decoded = this.decodeNinePayData(payload.result);
    return { ...payload, ...decoded };
  }

  private verifyLegacyNinePaySignature(payload: Record<string, string>) {
    const secretKey = this.configService.get("payments.ninepay.secretKey", {
      infer: true,
    });
    if (!secretKey) return false;

    const message = payload.baseEncode || payload.d;
    const signature = payload.signature || payload.s;
    if (!message || !signature) return false;

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    return expected === signature;
  }

  private async handleNinePayIpn(payload: Record<string, string>) {
    const checksumKey = this.configService.get("payments.ninepay.checksumKey", {
      infer: true,
    });
    if (!checksumKey) return { status: 0, message: "9Pay is not configured" };

    if (!payload.result || !payload.checksum) {
      return { status: 0, message: "Invalid payload" };
    }

    const expectedChecksum = crypto
      .createHash("sha256")
      .update(payload.result + checksumKey)
      .digest("hex");

    if (expectedChecksum.toUpperCase() !== payload.checksum.toUpperCase()) {
      return { status: 0, message: "Invalid signature" };
    }

    let resultData: any;
    try {
      resultData = this.decodeNinePayData(payload.result);
    } catch {
      return { status: 0, message: "Invalid result format" };
    }

    const orderCode =
      resultData.invoice_no || resultData.request_code || resultData.invoice;
    if (!orderCode) {
      return { status: 0, message: "Order not found" };
    }

    const order = await this.paymentOrderRepository.findOne({
      where: { orderCode, provider: "9pay" },
    });

    if (!order) return { status: 0, message: "Order not found" };

    const status = ["4", "5"].includes(String(resultData.status))
      ? "paid"
      : "failed";

    const mergedPayload = { ...payload, ...resultData };
    await this.finalizeOrder(order, status, mergedPayload);

    return { status: 1, message: "Success" };
  }
}
