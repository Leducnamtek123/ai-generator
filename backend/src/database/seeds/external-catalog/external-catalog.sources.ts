import { TemplateTypeEnum } from '../../../templates/types/template-type.enum';

export type ExternalCatalogVisibility = 'public' | 'community';

export type ExternalCatalogSourceKind =
  | 'prompts-chat'
  | 'prompt-library'
  | 'system-prompt-library';

export interface ExternalCatalogSource {
  id: string;
  name: string;
  url: string;
  kind: ExternalCatalogSourceKind;
  visibility: ExternalCatalogVisibility;
  defaultType: TemplateTypeEnum;
  defaultPriceCredits: number;
  maxItems: number;
  featuredCount: number;
  tags: string[];
  baseUrl?: string;
  sourceLicense?: string;
}

export const EXTERNAL_CATALOG_SOURCES: ExternalCatalogSource[] = [
  {
    id: 'prompts-chat',
    name: 'prompts.chat',
    url: 'https://raw.githubusercontent.com/f/prompts.chat/main/PROMPTS.md',
    kind: 'prompts-chat',
    visibility: 'public',
    defaultType: TemplateTypeEnum.AI_ASSISTANT,
    defaultPriceCredits: 0,
    maxItems: 20,
    featuredCount: 5,
    tags: ['prompt', 'community', 'open-source', 'assistant'],
    sourceLicense: 'see source repository',
  },
  {
    id: 'prompt-library',
    name: 'RISE prompt library',
    url: 'https://raw.githubusercontent.com/RISE-UNIBAS/prompt-library/main/prompts.json',
    kind: 'prompt-library',
    visibility: 'community',
    defaultType: TemplateTypeEnum.AI_ASSISTANT,
    defaultPriceCredits: 12,
    maxItems: 20,
    featuredCount: 5,
    tags: ['prompt', 'research', 'structured', 'community'],
    sourceLicense: 'CC BY 4.0',
  },
  {
    id: 'system-prompt-library',
    name: 'System Prompt Library',
    url: 'https://huggingface.co/datasets/Doszzzhan/System-Prompt-Library/resolve/main/index.md',
    kind: 'system-prompt-library',
    visibility: 'public',
    defaultType: TemplateTypeEnum.AI_ASSISTANT,
    defaultPriceCredits: 0,
    maxItems: 20,
    featuredCount: 5,
    tags: ['system-prompt', 'agent', 'community', 'open-source'],
    baseUrl:
      'https://huggingface.co/datasets/Doszzzhan/System-Prompt-Library/resolve/main/',
    sourceLicense: 'CC BY 4.0',
  },
];
