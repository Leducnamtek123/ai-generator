import { DataSource } from 'typeorm';
import { CommunityMarketplaceService } from './community-marketplace.service';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { BillingAccountEntity } from '../billing-accounts/infrastructure/persistence/relational/entities/billing-account.entity';
import { CreditTransactionEntity } from '../credits/infrastructure/persistence/relational/entities/credit-transaction.entity';

describe('CommunityMarketplaceService', () => {
  const createService = () => {
    const template: any = {
      id: 'template-1',
      title: 'Creator Template',
      description: 'A production listing',
      thumbnail: 'https://example.com/thumb.png',
      type: 'image-generator',
      visibility: 'community',
      content: {
        prompt: 'Generate a moody editorial portrait',
        marketplace: {
          listed: true,
          priceCredits: 30,
          platformFeeBps: 1500,
          tags: ['portrait', 'editorial'],
          sourceTemplateId: 'template-1',
        },
      },
      authorId: 'creator-1',
      usageCount: 2,
      author: {
        id: 'creator-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      },
    };

    const accounts = new Map<string, any>();
    accounts.set('user:buyer-1', {
      scopeType: 'user',
      scopeId: 'buyer-1',
      status: 'free',
      currentPlanId: null,
      includedCreditsGranted: 0,
      includedCreditsRemaining: 0,
      topUpCreditsPurchased: 100,
      topUpCreditsBalance: 100,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewalAt: null,
      metadata: null,
    });

    let purchasedSequence = 0;

    const templateQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(async () => template),
    };

    const templateRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(templateQueryBuilder),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation(async (entity) => {
        const saved = { ...entity };
        if (!saved.id) {
          purchasedSequence += 1;
          saved.id = `purchased-${purchasedSequence}`;
        }
        if (saved.id === template.id) {
          Object.assign(template, saved);
        }
        return saved;
      }),
    };

    const billingAccountRepository = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return accounts.get(`${where.scopeType}:${where.scopeId}`) ?? null;
      }),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation(async (entity) => {
        const saved = { ...entity };
        accounts.set(`${saved.scopeType}:${saved.scopeId}`, saved);
        return saved;
      }),
    };

    const creditTransactionRepository = {
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const manager = {
      query: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === TemplateEntity) {
          return templateRepository;
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

    const service = new CommunityMarketplaceService(
      templateRepository as any,
      dataSource,
    );

    return {
      service,
      template,
      templateRepository,
      billingAccountRepository,
      creditTransactionRepository,
      dataSource,
      manager,
      accounts,
    };
  };

  it('purchases the template atomically and posts all ledger entries in one transaction', async () => {
    const {
      service,
      templateRepository,
      billingAccountRepository,
      creditTransactionRepository,
      dataSource,
    } = createService();

    const result = await service.purchase('buyer-1', 'template-1');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(templateRepository.save).toHaveBeenCalledTimes(2);
    expect(billingAccountRepository.save).toHaveBeenCalledTimes(3);
    expect(creditTransactionRepository.save).toHaveBeenCalledTimes(3);
    expect(result.balance).toBe(70);
    expect(result.creatorBalance).toBe(26);
    expect(result.platformBalance).toBe(4);
    expect(result.purchasedTemplate.id).toBe('purchased-1');
    expect(result.purchasedTemplate.visibility).toBe('private');
  });

  it('rejects purchases when the buyer cannot cover the listing price', async () => {
    const { service, accounts, templateRepository, billingAccountRepository, creditTransactionRepository, dataSource } =
      createService();

    accounts.set('user:buyer-1', {
      scopeType: 'user',
      scopeId: 'buyer-1',
      status: 'free',
      currentPlanId: null,
      includedCreditsGranted: 0,
      includedCreditsRemaining: 0,
      topUpCreditsPurchased: 5,
      topUpCreditsBalance: 5,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      renewalAt: null,
      metadata: null,
    });

    await expect(service.purchase('buyer-1', 'template-1')).rejects.toThrow(
      'Insufficient credits',
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(templateRepository.save).not.toHaveBeenCalled();
    expect(billingAccountRepository.save).not.toHaveBeenCalled();
    expect(creditTransactionRepository.save).not.toHaveBeenCalled();
  });
});
