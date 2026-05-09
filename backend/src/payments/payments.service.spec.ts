import { DataSource } from 'typeorm';
import { PaymentsService } from './payments.service';
import { PaymentOrderEntity } from './infrastructure/persistence/relational/entities/payment-order.entity';
import { BillingAccountEntity } from '../billing-accounts/infrastructure/persistence/relational/entities/billing-account.entity';
import { CreditTransactionEntity } from '../credits/infrastructure/persistence/relational/entities/credit-transaction.entity';

describe('PaymentsService', () => {
  const createService = () => {
    const paymentOrder = {
      id: 'order-1',
      userId: 'user-1',
      provider: 'vnpay',
      purchaseType: 'topup',
      orderCode: 'ORDER-1',
      planId: null,
      topUpPackageId: null,
      scopeType: 'user',
      scopeId: 'user-1',
      credits: 10,
      amountVnd: 100000,
      status: 'pending',
      paymentUrl: null,
      providerTxnRef: null,
      metadata: null,
      callbackPayload: null,
      paidAt: null,
    } as any;

    let billingAccount: any = null;

    const orderQb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(async () => paymentOrder),
    };

    const billingQb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(async () => billingAccount),
    };

    const paymentOrderRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(orderQb),
      save: jest.fn().mockImplementation(async (entity) => {
        Object.assign(paymentOrder, entity);
        return paymentOrder;
      }),
    };

    const billingAccountRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(billingQb),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation(async (entity) => {
        billingAccount = { ...entity };
        return billingAccount;
      }),
    };

    const creditTransactionRepository = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === PaymentOrderEntity) {
          return paymentOrderRepository;
        }
        if (entity === BillingAccountEntity) {
          return billingAccountRepository;
        }
        if (entity === CreditTransactionEntity) {
          return creditTransactionRepository;
        }
        throw new Error(`Unexpected entity: ${String(entity)}`);
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (callback: (manager: any) => Promise<unknown>) =>
        callback(manager),
      ),
    } as unknown as DataSource;

    const notificationsService = {
      notifyUser: jest.fn().mockResolvedValue(undefined),
    };

    const service = new PaymentsService(
      paymentOrderRepository as any,
      {} as any,
      dataSource,
      { get: jest.fn() } as any,
      notificationsService as any,
    );

    return {
      service,
      paymentOrder,
      paymentOrderRepository,
      billingAccountRepository,
      creditTransactionRepository,
      notificationsService,
    };
  };

  it('finalizes a paid order once and ignores duplicate paid callbacks', async () => {
    const { service, paymentOrderRepository, billingAccountRepository, creditTransactionRepository, notificationsService, paymentOrder } =
      createService();

    const payload = {
      vnp_TransactionNo: 'TX-123',
      vnp_ResponseCode: '00',
    } as Record<string, string>;

    await (service as any).finalizeOrder(paymentOrder, 'paid', payload);
    await (service as any).finalizeOrder(paymentOrder, 'paid', payload);

    expect(paymentOrderRepository.save).toHaveBeenCalledTimes(1);
    expect(billingAccountRepository.save).toHaveBeenCalledTimes(2);
    expect(creditTransactionRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationsService.notifyUser).toHaveBeenCalledTimes(1);
    expect(paymentOrder.status).toBe('paid');
    expect(paymentOrder.providerTxnRef).toBe('TX-123');
    expect(paymentOrder.paidAt).toBeInstanceOf(Date);
    expect(billingAccountRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        topUpCreditsPurchased: 10,
        topUpCreditsBalance: 10,
        metadata: expect.objectContaining({
          paymentProvider: 'vnpay',
          orderCode: 'ORDER-1',
          purchaseType: 'topup',
        }),
      }),
    );
  });

  it('falls back to the configured return path for external return URIs', async () => {
    const { service, paymentOrder } = createService();

    const configService = (service as any).configService;
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        'app.frontendDomain': 'https://app.example.com',
        'payments.returnPath': '/billing/return',
      };
      return values[key];
    });

    paymentOrder.metadata = {
      returnUri: 'https://evil.example/phishing',
    };

    const redirectUrl = (service as any).buildFrontendReturnUrl(
      paymentOrder,
      'vnpay',
      'paid',
      true,
    );

    expect(redirectUrl).toBe(
      'https://app.example.com/billing/return?paymentProvider=vnpay&paymentOrder=ORDER-1&paymentStatus=paid&paymentVerified=true',
    );
  });
});
