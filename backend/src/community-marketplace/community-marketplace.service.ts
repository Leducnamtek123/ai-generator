import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { BillingAccountEntity } from '../billing-accounts/infrastructure/persistence/relational/entities/billing-account.entity';
import { CreditTransactionEntity } from '../credits/infrastructure/persistence/relational/entities/credit-transaction.entity';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreateCommunityListingDto } from './dto/create-community-listing.dto';
import { UpdateCommunityListingDto } from './dto/update-community-listing.dto';

type MarketplaceMeta = {
  listed: boolean;
  priceCredits: number;
  platformFeeBps: number;
  tags: string[];
  sourceTemplateId?: string | null;
  listedAt?: string;
  featured?: boolean;
};

export type CommunityMarketplaceItem = TemplateEntity & {
  marketplace: MarketplaceMeta & {
    platformFeeCredits: number;
    creatorPayoutCredits: number;
  };
};

@Injectable()
export class CommunityMarketplaceService {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    filters: {
      q?: string;
      type?: string;
      authorId?: string;
    } = {},
  ): Promise<CommunityMarketplaceItem[]> {
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author')
      .where('template.visibility = :visibility', { visibility: 'community' })
      .andWhere(
        "COALESCE((template.content->'marketplace'->>'listed')::boolean, false) = true",
      )
      .orderBy('template.createdAt', 'DESC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (filters.type && filters.type !== 'all') {
      const typeByAlias: Record<string, string> = {
        image: 'image-generator',
        video: 'video-generator',
        music: 'music-generator',
        voice: 'voice-generator',
        sfx: 'sfx-generator',
      };
      const mappedType = typeByAlias[filters.type] ?? filters.type;
      qb.andWhere('template.type = :type', { type: mappedType });
    }

    if (filters.authorId) {
      qb.andWhere('template.authorId = :authorId', {
        authorId: filters.authorId,
      });
    }

    if (filters.q?.trim()) {
      qb.andWhere(
        `(template.title ILIKE :query OR template.description ILIKE :query OR CONCAT(COALESCE(author."firstName", ''), ' ', COALESCE(author."lastName", '')) ILIKE :query)`,
        {
          query: `%${filters.q.trim()}%`,
        },
      );
    }

    const [items] = await qb.getManyAndCount();
    return items.map((item) => this.enrichMarketplaceItem(item));
  }

  async findOne(id: string): Promise<CommunityMarketplaceItem> {
    const template = await this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.author', 'author')
      .where('template.id = :id', { id })
      .getOne();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.enrichMarketplaceItem(template);
  }

  async findMine(
    userId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<CommunityMarketplaceItem[]> {
    return this.findAll(paginationOptions, { authorId: userId });
  }

  async create(userId: string, dto: CreateCommunityListingDto) {
    const sourceTemplate = dto.sourceTemplateId
      ? await this.templateRepository.findOne({
          where: { id: dto.sourceTemplateId },
          relations: ['author'],
        })
      : null;

    if (dto.sourceTemplateId && !sourceTemplate) {
      throw new NotFoundException('Source template not found');
    }

    if (sourceTemplate && sourceTemplate.authorId !== userId) {
      throw new ForbiddenException('You can only sell your own templates');
    }

    const baseContent =
      (sourceTemplate?.content as Record<string, unknown> | null | undefined) ??
      {};
    const marketplace = this.buildMarketplaceMeta({
      listed: dto.listed ?? true,
      priceCredits: dto.priceCredits,
      platformFeeBps: dto.platformFeeBps ?? 1500,
      tags: dto.tags ?? [],
      sourceTemplateId: sourceTemplate?.id ?? dto.sourceTemplateId ?? null,
      listedAt: new Date().toISOString(),
      featured: Boolean((baseContent as Record<string, unknown>)?.['featured']),
    });

    const template = this.templateRepository.create({
      title: dto.title || sourceTemplate?.title,
      description: dto.description ?? sourceTemplate?.description,
      thumbnail: dto.thumbnail ?? sourceTemplate?.thumbnail,
      type: (dto.type || sourceTemplate?.type || 'workflow-editor') as
        | TemplateEntity['type']
        | undefined,
      visibility: 'community',
      content: {
        ...baseContent,
        ...dto.content,
        marketplace,
      },
      authorId: userId,
      usageCount: sourceTemplate?.usageCount ?? 0,
    });

    const saved = await this.templateRepository.save(template);
    return this.enrichMarketplaceItem(
      await this.templateRepository.findOneOrFail({
        where: { id: saved.id },
        relations: ['author'],
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdateCommunityListingDto) {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== userId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    const currentContent =
      (template.content as Record<string, unknown> | null | undefined) ?? {};
    const currentMarketplace = this.extractMarketplaceMeta(template);
    const nextMarketplace = this.buildMarketplaceMeta({
      listed: dto.listed ?? currentMarketplace.listed,
      priceCredits: dto.priceCredits ?? currentMarketplace.priceCredits,
      platformFeeBps: dto.platformFeeBps ?? currentMarketplace.platformFeeBps,
      tags: dto.tags ?? currentMarketplace.tags,
      sourceTemplateId:
        dto.sourceTemplateId ?? currentMarketplace.sourceTemplateId ?? template.id,
      listedAt: currentMarketplace.listedAt ?? new Date().toISOString(),
      featured: currentMarketplace.featured,
    });

    template.title = dto.title ?? template.title;
    template.description = dto.description ?? template.description;
    template.thumbnail = dto.thumbnail ?? template.thumbnail;
    template.type = (dto.type ?? template.type) as any;
    template.content = {
      ...currentContent,
      ...dto.content,
      marketplace: nextMarketplace,
    };

    const saved = await this.templateRepository.save(template);
    return this.enrichMarketplaceItem(
      await this.templateRepository.findOneOrFail({
        where: { id: saved.id },
        relations: ['author'],
      }),
    );
  }

  async remove(userId: string, id: string) {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.templateRepository.softDelete(id);
    return { success: true };
  }

  async purchase(userId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const templateRepository = manager.getRepository(TemplateEntity);
      const billingAccountRepository = manager.getRepository(BillingAccountEntity);
      const creditTransactionRepository = manager.getRepository(CreditTransactionEntity);

      const template = await templateRepository
        .createQueryBuilder('template')
        .leftJoinAndSelect('template.author', 'author')
        .setLock('pessimistic_write')
        .where('template.id = :id', { id })
        .getOne();

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      if (template.authorId === userId) {
        throw new BadRequestException('You already own this template');
      }

      const marketplace = this.extractMarketplaceMeta(template);
      if (!marketplace.listed) {
        throw new BadRequestException('This template is not listed for sale');
      }

      if (!marketplace.priceCredits || marketplace.priceCredits < 1) {
        throw new BadRequestException('This template does not have a valid price');
      }

      const platformFeeCredits = this.computePlatformFee(
        marketplace.priceCredits,
        marketplace.platformFeeBps,
      );
      const creatorPayoutCredits =
        marketplace.priceCredits - platformFeeCredits;

      await this.lockBillingScope(manager, 'user', userId);
      const buyerAccount = await this.getOrCreateBillingAccount(
        billingAccountRepository,
        'user',
        userId,
      );
      const buyerAllocation = this.debitBillingAccount(
        buyerAccount,
        marketplace.priceCredits,
      );
      await billingAccountRepository.save(buyerAccount);

      await creditTransactionRepository.save(
        creditTransactionRepository.create({
          userId,
          scopeType: 'user',
          scopeId: userId,
          amount: -marketplace.priceCredits,
          type: 'adjustment',
          status: 'posted',
          referenceType: 'template_purchase',
          referenceId: template.id,
          metadata: {
            templateId: template.id,
            sellerId: template.authorId,
            buyerId: userId,
            priceCredits: marketplace.priceCredits,
            platformFeeCredits,
            creatorPayoutCredits,
            allocation: buyerAllocation,
          },
        }),
      );

      await this.lockBillingScope(manager, 'user', template.authorId);
      const sellerAccount = await this.getOrCreateBillingAccount(
        billingAccountRepository,
        'user',
        template.authorId,
      );
      this.creditBillingAccount(sellerAccount, creatorPayoutCredits, {
        templateId: template.id,
        buyerId: userId,
        sellerId: template.authorId,
        priceCredits: marketplace.priceCredits,
        platformFeeCredits,
        creatorPayoutCredits,
        lastGrantType: 'sale',
      });
      await billingAccountRepository.save(sellerAccount);

      await creditTransactionRepository.save(
        creditTransactionRepository.create({
          userId: template.authorId,
          scopeType: 'user',
          scopeId: template.authorId,
          amount: creatorPayoutCredits,
          type: 'topup',
          status: 'posted',
          referenceType: 'template_sale',
          referenceId: template.id,
          metadata: {
            templateId: template.id,
            buyerId: userId,
            sellerId: template.authorId,
            priceCredits: marketplace.priceCredits,
            platformFeeCredits,
            creatorPayoutCredits,
          },
        }),
      );

      await this.lockBillingScope(manager, 'user', 'platform');
      const platformAccount = await this.getOrCreateBillingAccount(
        billingAccountRepository,
        'user',
        'platform',
      );
      if (platformFeeCredits > 0) {
        this.creditBillingAccount(platformAccount, platformFeeCredits, {
          templateId: template.id,
          buyerId: userId,
          sellerId: template.authorId,
          priceCredits: marketplace.priceCredits,
          platformFeeCredits,
          creatorPayoutCredits,
          lastGrantType: 'fee',
        });
        await billingAccountRepository.save(platformAccount);

        await creditTransactionRepository.save(
          creditTransactionRepository.create({
            userId: 'platform',
            scopeType: 'user',
            scopeId: 'platform',
            amount: platformFeeCredits,
            type: 'topup',
            status: 'posted',
            referenceType: 'template_fee',
            referenceId: template.id,
            metadata: {
              templateId: template.id,
              buyerId: userId,
              sellerId: template.authorId,
              priceCredits: marketplace.priceCredits,
              platformFeeCredits,
              creatorPayoutCredits,
            },
          }),
        );
      }

      template.usageCount = (template.usageCount || 0) + 1;
      template.content = {
        ...(template.content as Record<string, unknown> | null | undefined),
        marketplace: {
          ...marketplace,
          purchasedAt: new Date().toISOString(),
          lastPurchasedBy: userId,
        },
      };
      const savedTemplate = await templateRepository.save(template);

      const purchasedTemplate = templateRepository.create({
        title: template.title,
        description: template.description,
        thumbnail: template.thumbnail,
        type: template.type,
        visibility: 'private',
        content: {
          ...(template.content as Record<string, unknown> | null | undefined),
          marketplace: {
            ...marketplace,
            purchasedFrom: template.id,
            purchasedAt: new Date().toISOString(),
            priceCredits: marketplace.priceCredits,
            platformFeeCredits,
            creatorPayoutCredits,
          },
        },
        authorId: userId,
        usageCount: 0,
      } as DeepPartial<TemplateEntity>);

      const savedPurchased = await templateRepository.save(purchasedTemplate);

      return {
        marketplace: this.enrichMarketplaceItem(savedTemplate),
        purchasedTemplate: savedPurchased,
        balance: this.getBillingBalance(buyerAccount),
        creatorBalance: this.getBillingBalance(sellerAccount),
        platformBalance: this.getBillingBalance(platformAccount),
      };
    });
  }

  private async lockBillingScope(
    manager: EntityManager,
    scopeType: string,
    scopeId: string,
  ) {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `billing-account:${scopeType}:${scopeId}`,
    ]);
  }

  private async getOrCreateBillingAccount(
    billingAccountRepository: Repository<BillingAccountEntity>,
    scopeType: string,
    scopeId: string,
  ) {
    let billingAccount = await billingAccountRepository.findOne({
      where: { scopeType: scopeType as any, scopeId },
    });

    if (!billingAccount) {
      billingAccount = billingAccountRepository.create({
        scopeType: scopeType as any,
        scopeId,
        status: 'free',
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
    }

    return billingAccount;
  }

  private debitBillingAccount(
    billingAccount: BillingAccountEntity,
    amount: number,
  ) {
    const normalizedAmount = Math.max(0, Math.abs(amount));
    const totalAvailable =
      (billingAccount.includedCreditsRemaining || 0) +
      (billingAccount.topUpCreditsBalance || 0);

    if (totalAvailable < normalizedAmount) {
      throw new BadRequestException('Insufficient credits');
    }

    const includedCredits = Math.min(
      billingAccount.includedCreditsRemaining || 0,
      normalizedAmount,
    );
    const topUpCredits = normalizedAmount - includedCredits;

    billingAccount.includedCreditsRemaining =
      (billingAccount.includedCreditsRemaining || 0) - includedCredits;
    billingAccount.topUpCreditsBalance =
      (billingAccount.topUpCreditsBalance || 0) - topUpCredits;
    billingAccount.metadata = {
      ...(billingAccount.metadata || {}),
      lastAllocationAt: new Date().toISOString(),
    };

    return { includedCredits, topUpCredits };
  }

  private creditBillingAccount(
    billingAccount: BillingAccountEntity,
    amount: number,
    metadata: Record<string, unknown>,
  ) {
    const normalizedAmount = Math.max(0, Math.abs(amount));

    billingAccount.topUpCreditsPurchased =
      (billingAccount.topUpCreditsPurchased || 0) + normalizedAmount;
    billingAccount.topUpCreditsBalance =
      (billingAccount.topUpCreditsBalance || 0) + normalizedAmount;
    billingAccount.metadata = {
      ...(billingAccount.metadata || {}),
      ...metadata,
    };
  }

  private getBillingBalance(billingAccount: BillingAccountEntity | null) {
    if (!billingAccount) {
      return 0;
    }

    return (
      (billingAccount.includedCreditsRemaining || 0) +
      (billingAccount.topUpCreditsBalance || 0)
    );
  }

  private enrichMarketplaceItem(template: TemplateEntity): CommunityMarketplaceItem {
    const marketplace = this.extractMarketplaceMeta(template);
    return {
      ...template,
      marketplace: {
        ...marketplace,
        platformFeeCredits: this.computePlatformFee(
          marketplace.priceCredits,
          marketplace.platformFeeBps,
        ),
        creatorPayoutCredits:
          marketplace.priceCredits -
          this.computePlatformFee(
            marketplace.priceCredits,
            marketplace.platformFeeBps,
          ),
      },
    } as CommunityMarketplaceItem;
  }

  private extractMarketplaceMeta(template: TemplateEntity): MarketplaceMeta {
    const content = (template.content as Record<string, unknown> | null) ?? {};
    const rawMarketplace = (content.marketplace ||
      {}) as Partial<MarketplaceMeta> & { price?: number; feeBps?: number };

    const priceCredits =
      Number(rawMarketplace.priceCredits ?? rawMarketplace.price ?? 0) || 0;
    const platformFeeBps =
      Number(rawMarketplace.platformFeeBps ?? rawMarketplace.feeBps ?? 1500) ||
      1500;
    const tags = Array.isArray(rawMarketplace.tags)
      ? rawMarketplace.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];

    return {
      listed:
        Boolean(rawMarketplace.listed ?? template.visibility === 'community') &&
        priceCredits > 0,
      priceCredits,
      platformFeeBps,
      tags,
      sourceTemplateId: rawMarketplace.sourceTemplateId ?? template.id,
      listedAt: rawMarketplace.listedAt,
      featured: Boolean(rawMarketplace.featured),
    };
  }

  private buildMarketplaceMeta(input: MarketplaceMeta): MarketplaceMeta {
    return {
      listed: input.listed ?? true,
      priceCredits: Number(input.priceCredits) || 0,
      platformFeeBps: Number(input.platformFeeBps) || 1500,
      tags: input.tags ?? [],
      sourceTemplateId: input.sourceTemplateId ?? null,
      listedAt: input.listedAt,
      featured: Boolean(input.featured),
    };
  }

  private computePlatformFee(priceCredits: number, feeBps: number) {
    if (!priceCredits || priceCredits < 1) return 0;
    const safeBps = Number.isFinite(feeBps) ? Math.max(0, feeBps) : 1500;
    return Math.max(0, Math.floor((priceCredits * safeBps) / 10000));
  }
}
