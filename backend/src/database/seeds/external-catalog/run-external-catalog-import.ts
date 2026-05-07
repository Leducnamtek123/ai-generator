import { TemplateEntity } from '../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { UserEntity } from '../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TemplateTypeEnum } from '../../../templates/types/template-type.enum';
import {
  EXTERNAL_CATALOG_SOURCES,
  type ExternalCatalogSource,
  type ExternalCatalogSourceKind,
} from './external-catalog.sources';

let appDataSource: any = null;

type ImportedTemplateCandidate = {
  title: string;
  description?: string;
  thumbnail?: string;
  type: TemplateTypeEnum;
  visibility: 'public' | 'community';
  tags: string[];
  priceCredits: number;
  featured: boolean;
  content: Record<string, unknown>;
  source: {
    sourceId: string;
    sourceName: string;
    sourceUrl: string;
    entryUrl?: string;
    externalId: string;
    license?: string;
    kind: ExternalCatalogSourceKind;
  };
};

const DEFAULT_THUMBNAILS: Record<TemplateTypeEnum, string> = {
  [TemplateTypeEnum.AI_ASSISTANT]:
    'https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.WORKFLOW_EDITOR]:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.IMAGE_GENERATOR]:
    'https://images.unsplash.com/photo-1516117172878-fd2c41f4a759?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.VIDEO_GENERATOR]:
    'https://images.unsplash.com/photo-1512323770267-1f98d4f98fef?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.DESIGN_EDITOR]:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.IMAGE_UPSCALER]:
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.VIDEO_UPSCALER]:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.VOICE_GENERATOR]:
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.MUSIC_GENERATOR]:
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.SOUND_EFFECT_GENERATOR]:
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.ICON_GENERATOR]:
    'https://images.unsplash.com/photo-1586717799252-bd134ad00e26?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.MOCKUP_GENERATOR]:
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop',
  [TemplateTypeEnum.BG_REMOVER]:
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop',
};

export interface ExternalCatalogImportOptions {
  dryRun: boolean;
  force: boolean;
  sources: string[];
  maxItems: number;
  authorEmail?: string;
}

export type ExternalCatalogImportResult = {
  dryRun: boolean;
  results: Array<{
    sourceId: string;
    sourceName: string;
    discovered: number;
    inserted: number;
    skipped: number;
    samples: string[];
  }>;
};

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const compact = (value: string, length = 200) => {
  const normalized = normalizeText(value).replace(/\s+/g, ' ');
  return normalized.length > length
    ? `${normalized.slice(0, length - 3).trimEnd()}...`
    : normalized;
};

const parseArgs = (): ExternalCatalogImportOptions => {
  const args = process.argv.slice(2);
  const getValue = (name: string, fallback: string) => {
    const match = args.find((arg) => arg.startsWith(`--${name}=`));
    return match ? match.slice(name.length + 3) : fallback;
  };

  const sources = getValue(
    'sources',
    EXTERNAL_CATALOG_SOURCES.map((source) => source.id).join(','),
  )
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    sources,
    maxItems: Number.parseInt(getValue('max-items', '20'), 10) || 20,
  };
};

const inferType = (
  source: ExternalCatalogSource,
  title: string,
  description?: string,
  body?: string,
) => {
  const haystack = `${title} ${description ?? ''} ${body ?? ''}`.toLowerCase();

  if (
    /(video|motion|cinematic|animation|animate|film|drone|trailer|reel)/.test(
      haystack,
    )
  ) {
    return TemplateTypeEnum.VIDEO_GENERATOR;
  }

  if (/(voice|speech|narration|tts|podcast)/.test(haystack)) {
    return TemplateTypeEnum.VOICE_GENERATOR;
  }

  if (/(music|song|beat|audio|sound|sfx|effect|ambience|ambient)/.test(haystack)) {
    return TemplateTypeEnum.MUSIC_GENERATOR;
  }

  if (/(upscale|restore|enhance|denoise|super resolution)/.test(haystack)) {
    return /video/.test(haystack)
      ? TemplateTypeEnum.VIDEO_UPSCALER
      : TemplateTypeEnum.IMAGE_UPSCALER;
  }

  if (/(mockup|logo|poster|banner|thumbnail|layout|design|card|cover)/.test(haystack)) {
    return TemplateTypeEnum.DESIGN_EDITOR;
  }

  if (/(image|photo|illustration|art|midjourney|stable diffusion|dall-?e|flux|visual)/.test(haystack)) {
    return TemplateTypeEnum.IMAGE_GENERATOR;
  }

  if (source.defaultType === TemplateTypeEnum.WORKFLOW_EDITOR) {
    return TemplateTypeEnum.WORKFLOW_EDITOR;
  }

  return source.defaultType;
};

const chooseThumbnail = (type: TemplateTypeEnum, provided?: string) =>
  provided?.trim() || DEFAULT_THUMBNAILS[type];

const estimatePrice = (type: TemplateTypeEnum, source: ExternalCatalogSource) => {
  if (source.visibility === 'public') return 0;

  const base = source.defaultPriceCredits || 12;
  switch (type) {
    case TemplateTypeEnum.VIDEO_GENERATOR:
    case TemplateTypeEnum.VIDEO_UPSCALER:
      return Math.max(base, 18);
    case TemplateTypeEnum.WORKFLOW_EDITOR:
      return Math.max(base, 16);
    case TemplateTypeEnum.IMAGE_GENERATOR:
    case TemplateTypeEnum.DESIGN_EDITOR:
      return Math.max(base, 14);
    case TemplateTypeEnum.MUSIC_GENERATOR:
    case TemplateTypeEnum.VOICE_GENERATOR:
    case TemplateTypeEnum.SOUND_EFFECT_GENERATOR:
      return Math.max(base, 12);
    default:
      return Math.max(base, 10);
  }
};

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'ai-generator-external-catalog-import/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

const resolveRelativeUrl = (baseUrl: string, relativePath: string) => {
  const trimmedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const sanitizedPath = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${trimmedBase}${sanitizedPath}`;
};

const parsePromptsChat = (
  source: ExternalCatalogSource,
  content: string,
): ImportedTemplateCandidate[] => {
  const detailsBlockRegex =
    /<details>[\s\S]*?<summary><strong>([^<]+)<\/strong><\/summary>[\s\S]*?```md\s*([\s\S]*?)```[\s\S]*?<\/details>/g;
  const items: ImportedTemplateCandidate[] = [];

  for (const match of content.matchAll(detailsBlockRegex)) {
    const title = normalizeText(match[1] || '');
    const prompt = normalizeText(match[2] || '');
    if (!title || !prompt) continue;

    const type = inferType(source, title, undefined, prompt);
    items.push({
      title,
      description: compact(prompt, 180),
      thumbnail: chooseThumbnail(type),
      type,
      visibility: source.visibility,
      tags: Array.from(new Set([...source.tags, slugify(type)])),
      priceCredits: estimatePrice(type, source),
      featured: items.length < source.featuredCount,
      content: {
        prompt,
        sourceTextFormat: 'markdown-details',
      },
      source: {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        entryUrl: source.url,
        externalId: slugify(title),
        kind: source.kind,
        license: source.sourceLicense,
      },
    });

    if (items.length >= source.maxItems) break;
  }

  return items;
};

const parsePromptLibrary = (
  source: ExternalCatalogSource,
  content: string,
): ImportedTemplateCandidate[] => {
  const parsed = JSON.parse(content) as Array<Record<string, unknown>>;
  const items: ImportedTemplateCandidate[] = [];

  for (const [index, row] of parsed.entries()) {
    const title = normalizeText(
      String(row['dcterms:title'] ?? row['prompt_title'] ?? row['title'] ?? row['dcterms:identifier'] ?? ''),
    );
    const promptText = normalizeText(
      String(row.prompt_text ?? row['systemprompt'] ?? row['prompt'] ?? ''),
    );
    if (!title || !promptText) continue;

    const description = normalizeText(
      String(row['dcterms:description'] ?? row.description ?? ''),
    );
    const type = inferType(source, title, description, promptText);
    const externalId = normalizeText(
      String(row['dcterms:identifier'] ?? title ?? `${source.id}-${index + 1}`),
    );

    items.push({
      title,
      description: description || compact(promptText, 180),
      thumbnail: chooseThumbnail(type),
      type,
      visibility: source.visibility,
      tags: Array.from(
        new Set([
          ...source.tags,
          ...(Array.isArray(row['dcterms:relation'])
            ? (row['dcterms:relation'] as string[])
            : []),
          ...(String(row['dcterms:subject'] ?? '')
            .split(/[,/]/)
            .map((tag) => tag.trim())
            .filter(Boolean) as string[]),
          slugify(type),
        ]),
      ),
      priceCredits: estimatePrice(type, source),
      featured: items.length < source.featuredCount,
      content: {
        promptText,
        inputExample: row.input_example ?? null,
        outputExample: row.output_example ?? null,
        creator: row['dcterms:creator'] ?? null,
        version: row['dcterms:hasVersion'] ?? null,
        modifiedAt: row['dcterms:modified'] ?? null,
        rights: row['dcterms:rights'] ?? null,
        relation: row['dcterms:relation'] ?? null,
      },
      source: {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        entryUrl: String(row['dcterms:hasPart'] ?? source.url),
        externalId,
        kind: source.kind,
        license: String(row['dcterms:rights'] ?? source.sourceLicense ?? ''),
      },
    });

    if (items.length >= source.maxItems) break;
  }

  return items;
};

const parseSystemPromptLibrary = async (
  source: ExternalCatalogSource,
  content: string,
): Promise<ImportedTemplateCandidate[]> => {
  const lines = content.split(/\r?\n/);
  const linkLines = lines.filter((line) => /^\| .* \| .* \| \[.*\]\(.*\) \|$/.test(line));
  const items: ImportedTemplateCandidate[] = [];

  for (const [index, line] of linkLines.entries()) {
    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 3) continue;

    const title = normalizeText(cells[0] ?? '');
    const description = normalizeText(cells[1] ?? '');
    const linkCell = cells[2] ?? '';
    const linkMatch = /\[(?<label>[^\]]+)\]\((?<path>.+)\)/.exec(linkCell);
    const relativePath = linkMatch?.groups?.path;
    if (!title || !relativePath) continue;

    const entryUrl = resolveRelativeUrl(source.baseUrl ?? '', relativePath);
    const jsonText = await fetchText(entryUrl);
    const promptJson = JSON.parse(jsonText) as Record<string, unknown>;
    const prompt = normalizeText(
      String(promptJson.systemprompt ?? promptJson.prompt ?? ''),
    );
    if (!prompt) continue;

    const type = inferType(source, title, description, prompt);
    const externalId = slugify(relativePath);

    items.push({
      title,
      description: description || compact(prompt, 180),
      thumbnail: chooseThumbnail(type),
      type,
      visibility: source.visibility,
      tags: Array.from(new Set([...source.tags, slugify(type)])),
      priceCredits: estimatePrice(type, source),
      featured: items.length < source.featuredCount,
      content: {
        systemPrompt: prompt,
        agentName: promptJson.agentname ?? title,
        creationDate: promptJson.creation_date ?? null,
        chatgptLink: promptJson.chatgptlink ?? null,
        capabilityFlags: {
          isAgent: promptJson['is-agent'] ?? null,
          isSingleTurn: promptJson['is-single-turn'] ?? null,
          structuredOutputGeneration: promptJson['structured-output-generation'] ?? null,
          imageGeneration: promptJson['image-generation'] ?? null,
          dataUtility: promptJson['data-utility'] ?? null,
          personalisedSystemPrompt: promptJson['personalised-system-prompt'] ?? null,
        },
        jsonSchema: promptJson['json-schema'] ?? null,
        jsonExample: promptJson['json-example'] ?? null,
        depersonalisedSystemPrompt:
          promptJson['depersonalised-system-prompt'] ?? null,
        privacy: promptJson['chatgpt-privacy'] ?? null,
      },
      source: {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        entryUrl,
        externalId,
        kind: source.kind,
        license: String(promptJson['rights'] ?? source.sourceLicense ?? ''),
      },
    });

    if (items.length >= source.maxItems) break;
  }

  return items;
};

const loadSourceItems = async (source: ExternalCatalogSource) => {
  const raw = await fetchText(source.url);
  switch (source.kind) {
    case 'prompts-chat':
      return parsePromptsChat(source, raw);
    case 'prompt-library':
      return parsePromptLibrary(source, raw);
    case 'system-prompt-library':
      return parseSystemPromptLibrary(source, raw);
  }
};

const buildMarketplaceMeta = (candidate: ImportedTemplateCandidate) => {
  if (candidate.visibility !== 'community') {
    return {
      listed: false,
      priceCredits: 0,
      platformFeeBps: 1500,
      tags: candidate.tags,
      sourceTemplateId: null,
      listedAt: new Date().toISOString(),
      featured: candidate.featured,
    };
  }

  return {
    listed: candidate.priceCredits > 0,
    priceCredits: candidate.priceCredits,
    platformFeeBps: 1500,
    tags: candidate.tags,
    sourceTemplateId: null,
    listedAt: new Date().toISOString(),
    featured: candidate.featured,
  };
};

const extractExternalKey = (content: unknown) => {
  const record = (content ?? {}) as Record<string, unknown>;
  const imported = (record.importedFrom ?? record.import ?? {}) as Record<
    string,
    unknown
  >;
  const sourceId = imported.sourceId ?? imported.source ?? null;
  const externalId = imported.externalId ?? imported.entryId ?? null;
  if (!sourceId || !externalId) return null;
  return `${String(sourceId)}:${String(externalId)}`;
};

export const runExternalCatalogImport = async (
  options: ExternalCatalogImportOptions,
  dataSource?: any,
): Promise<ExternalCatalogImportResult> => {
  const selectedSources = EXTERNAL_CATALOG_SOURCES.filter((source) =>
    options.sources.includes(source.id),
  );

  if (!selectedSources.length) {
    throw new Error(
      `No matching sources selected. Available: ${EXTERNAL_CATALOG_SOURCES.map((source) => source.id).join(', ')}`,
    );
  }

  const sourceItems = new Map<string, ImportedTemplateCandidate[]>();
  const previewResults: Array<{
    sourceId: string;
    sourceName: string;
    discovered: number;
    inserted: number;
    skipped: number;
    samples: string[];
  }> = [];

  for (const source of selectedSources) {
    const discovered = await loadSourceItems(source);
    const limited = discovered.slice(0, Math.max(1, options.maxItems));
    sourceItems.set(source.id, limited);

    previewResults.push({
      sourceId: source.id,
      sourceName: source.name,
      discovered: discovered.length,
      inserted: 0,
      skipped: 0,
      samples: limited.slice(0, 3).map((candidate) => candidate.title),
    });
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      results: previewResults,
    };
  }

  let ownsDataSource = false;
  if (dataSource) {
    appDataSource = dataSource;
  } else {
    const { AppDataSource } = await import('../../data-source');
    appDataSource = AppDataSource;
    if (!appDataSource.isInitialized) {
      await appDataSource.initialize();
      ownsDataSource = true;
    }
  }

  const templateRepository = appDataSource.getRepository(TemplateEntity);
  const userRepository = appDataSource.getRepository(UserEntity);

  const admin = await userRepository.findOne({
    where: { email: options.authorEmail ?? 'admin@example.com' },
  });

  if (!admin) {
    throw new Error(
      'Missing admin user. Run the relational seed first so admin@example.com exists.',
    );
  }

  const existingTemplates = await templateRepository.find({
    select: ['id', 'title', 'content'],
  });
  const existingKeys = new Set(
    existingTemplates
      .map((template) => extractExternalKey(template.content))
      .filter((value): value is string => Boolean(value)),
  );

  const results: Array<{
    sourceId: string;
    sourceName: string;
    discovered: number;
    inserted: number;
    skipped: number;
    samples: string[];
  }> = [];

  for (const source of selectedSources) {
    const limited = sourceItems.get(source.id) ?? [];
    let inserted = 0;
    let skipped = 0;

    for (const candidate of limited) {
      const externalKey = `${candidate.source.sourceId}:${candidate.source.externalId}`;
      if (!options.force && existingKeys.has(externalKey)) {
        skipped += 1;
        continue;
      }

      const marketplace = buildMarketplaceMeta(candidate);
      const template = templateRepository.create({
        title: candidate.title,
        description: candidate.description,
        thumbnail: candidate.thumbnail,
        type: candidate.type,
        visibility: candidate.visibility,
        content: {
          ...candidate.content,
          importedFrom: {
            ...candidate.source,
            importedAt: new Date().toISOString(),
          },
          marketplace,
        },
        authorId: String(admin.id),
        author: admin,
        usageCount: 0,
      });

      await templateRepository.save(template);

      existingKeys.add(externalKey);
      inserted += 1;
    }

    results.push({
      sourceId: source.id,
      sourceName: source.name,
      discovered: limited.length,
      inserted,
      skipped,
      samples: limited.slice(0, 3).map((candidate) => candidate.title),
    });
  }

  if (ownsDataSource) {
    await appDataSource.destroy();
  }

  return {
    dryRun: false,
    results,
  };
};

const main = async () => {
  const result = await runExternalCatalogImport(parseArgs());

  const summary = result.results
    .map((item) => {
      const sampleText =
        result.dryRun && item.samples.length
          ? `; samples=${item.samples.join(' | ')}`
          : '';
      return `${item.sourceId}: discovered=${item.discovered}, inserted=${item.inserted}, skipped=${item.skipped}${sampleText}`;
    })
    .join('\n');

  console.log(
    `${result.dryRun ? 'Dry run' : 'External catalog import'} complete.\n${summary}`,
  );
};

if (require.main === module) {
  void main().catch(async (error) => {
    console.error(error);
    try {
      await appDataSource?.destroy();
    } catch {
      // Ignore secondary shutdown errors.
    }
    process.exitCode = 1;
  });
}
