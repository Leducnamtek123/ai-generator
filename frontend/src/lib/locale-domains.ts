import { LOCALES, type LocaleCode } from "@/constants/i18n";

const DEFAULT_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const LOCALE_SITE_URLS: Partial<Record<LocaleCode, string>> = {
  en: (process.env.NEXT_PUBLIC_SITE_URL_EN || DEFAULT_SITE_URL).replace(/\/$/, ""),
  vi: (process.env.NEXT_PUBLIC_SITE_URL_VI || "").replace(/\/$/, "") || undefined
};

function getBaseSiteUrl(locale: LocaleCode): string {
  return LOCALE_SITE_URLS[locale] ?? DEFAULT_SITE_URL;
}

function getLocaleSiteUrl(locale: LocaleCode): string {
  return getBaseSiteUrl(locale);
}

export function getLocaleSiteUrls(): Record<LocaleCode, string> {
  return (Object.keys(LOCALES) as LocaleCode[]).reduce(
    (acc, locale) => {
      acc[locale] = getLocaleSiteUrl(locale);
      return acc;
    },
    {} as Record<LocaleCode, string>
  );
}

export function getLocaleDomains() {
  const domains: Array<{
    domain: string;
    defaultLocale: LocaleCode;
    locales: LocaleCode[];
  }> = [];
  const seenDomains = new Set<string>();

  for (const locale of Object.keys(LOCALES) as LocaleCode[]) {
    const siteUrl = getLocaleSiteUrl(locale);
    if (!siteUrl) continue;

    try {
      const domain = new URL(siteUrl).host;
      if (seenDomains.has(domain)) continue;

      seenDomains.add(domain);
      domains.push({
        domain,
        defaultLocale: locale,
        locales: [locale]
      });
    } catch {
      continue;
    }
  }

  return domains;
}

function resolveLocaleUrl(locale: LocaleCode, currentUrl?: string | URL): string {
  const targetBase = new URL(getLocaleSiteUrl(locale));

  if (!currentUrl) {
    return targetBase.toString();
  }

  const sourceUrl = typeof currentUrl === "string" ? new URL(currentUrl, targetBase) : currentUrl;

  targetBase.pathname = sourceUrl.pathname;
  targetBase.search = sourceUrl.search;
  targetBase.hash = sourceUrl.hash;

  return targetBase.toString();
}
