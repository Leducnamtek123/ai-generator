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
  const domainsByHost = new Map<
    string,
    {
      domain: string;
      defaultLocale: LocaleCode;
      locales: LocaleCode[];
    }
  >();

  for (const locale of Object.keys(LOCALES) as LocaleCode[]) {
    const siteUrl = getLocaleSiteUrl(locale);
    if (!siteUrl) continue;

    try {
      const domain = new URL(siteUrl).host;
      const existing = domainsByHost.get(domain);
      if (existing) {
        if (!existing.locales.includes(locale)) {
          existing.locales.push(locale);
        }
        continue;
      }

      domainsByHost.set(domain, {
        domain,
        defaultLocale: locale,
        locales: [locale]
      });
    } catch {
      continue;
    }
  }

  return Array.from(domainsByHost.values());
}
