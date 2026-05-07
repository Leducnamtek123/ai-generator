import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';
import { CreditsService } from '../credits/credits.service';
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
    private readonly creditsService: CreditsService,
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
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['author'],
    });

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

    const balance = await this.creditsService.getBalance(userId);
    if (balance < marketplace.priceCredits) {
      throw new BadRequestException('Insufficient credits');
    }

    const platformFeeCredits = this.computePlatformFee(
      marketplace.priceCredits,
      marketplace.platformFeeBps,
    );
    const creatorPayoutCredits =
      marketplace.priceCredits - platformFeeCredits;

    const purchaseReservation = await this.creditsService.reserve({
      userId,
      amount: marketplace.priceCredits,
      referenceType: 'template_purchase',
      referenceId: template.id,
      metadata: {
        templateId: template.id,
        sellerId: template.authorId,
        buyerId: userId,
        priceCredits: marketplace.priceCredits,
        platformFeeCredits,
        creatorPayoutCredits,
      },
    });
    await this.creditsService.capture(purchaseReservation.id, userId);

    await this.creditsService.addTopUpCredits({
      userId: template.authorId,
      amount: creatorPayoutCredits,
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
    });

    if (platformFeeCredits > 0) {
      await this.creditsService.addTopUpCredits({
        userId: 'platform',
        amount: platformFeeCredits,
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
    });
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
    await this.templateRepository.save(template);

    const purchasedTemplate = this.templateRepository.create({
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

    const savedPurchased = await this.templateRepository.save(purchasedTemplate);

    return {
      marketplace: this.enrichMarketplaceItem(template),
      purchasedTemplate: await this.templateRepository.findOneOrFail({
        where: { id: savedPurchased.id },
        relations: ['author'],
      }),
      balance: await this.creditsService.getBalance(userId),
      creatorBalance: await this.creditsService.getBalance(template.authorId),
      platformBalance: await this.creditsService.getBalance('platform'),
    };
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
