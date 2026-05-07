import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SiteConfigEntity } from './entities/site-config.entity';
import { QuerySiteConfigsDto } from './dto/query-site-configs.dto';
import { UpsertSiteConfigDto } from './dto/upsert-site-config.dto';

const DEFAULT_LOCALE = 'en';

const normalizeKey = (value: string) => value.trim();
const normalizeLocale = (value?: string) => value?.trim() || DEFAULT_LOCALE;
const cloneValue = (value: Record<string, unknown>) => JSON.parse(JSON.stringify(value)) as Record<
  string,
  unknown
>;

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfigEntity)
    private readonly repository: Repository<SiteConfigEntity>,
  ) {}

  async list(filters: QuerySiteConfigsDto = {}) {
    const where: FindOptionsWhere<SiteConfigEntity> = {};

    if (filters.key?.trim()) {
      where.key = normalizeKey(filters.key);
    }

    if (filters.locale?.trim()) {
      where.locale = normalizeLocale(filters.locale);
    }

    return this.repository.find({
      where,
      order: {
        key: 'ASC',
        locale: 'ASC',
      },
    });
  }

  async getByKey(key: string, locale?: string) {
    const normalizedKey = normalizeKey(key);
    const normalizedLocale = normalizeLocale(locale);

    return this.repository.findOne({
      where: {
        key: normalizedKey,
        locale: normalizedLocale,
      },
    });
  }

  async getByKeyWithFallback(key: string, locale?: string) {
    const exact = await this.getByKey(key, locale);
    if (exact) return exact;

    if (normalizeLocale(locale) !== DEFAULT_LOCALE) {
      return this.getByKey(key, DEFAULT_LOCALE);
    }

    return null;
  }

  async upsert(key: string, dto: UpsertSiteConfigDto, actorId?: number | null) {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey) {
      throw new BadRequestException('Config key is required');
    }

    const normalizedLocale = normalizeLocale(dto.locale);
    const existing = await this.getByKey(normalizedKey, normalizedLocale);
    const nextValue = cloneValue(dto.value);

    const saved = await this.repository.save(
      this.repository.create({
        id: existing?.id,
        key: normalizedKey,
        locale: normalizedLocale,
        value: nextValue,
        description: dto.description ?? existing?.description ?? null,
        updatedById: actorId ?? existing?.updatedById ?? null,
      }),
    );

    return saved;
  }
}
