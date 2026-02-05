import type { SiteConfigType } from "@/types/site-config.type";
import { DEFAULT_LOCALE } from "@/constants/i18n";
import { env } from "@/env";

// FIXME: Update site branding, default locale, theme color, social links, languages and OG image
export const siteConfig: SiteConfigType = {
  name: "PaintAI",
  description: "Your paint, your choice. The next-generation AI creative engine where you are the artist.",
  url: env.NEXT_PUBLIC_SITE_URL,
  author: "PaintAI Team",
  locale: DEFAULT_LOCALE,
  themeColor: "#3B82F6",
  keywords: ["ai generator", "image generation", "video generation", "creative ai", "paint ai"],
  social: {
    twitter: "@omergulcicek",
    github: "omergulcicek",
    linkedin: "omergulcicek"
  },
  ogImage: "/og.jpg",
  languages: {
    tr: "/tr",
    en: "/en"
  }
} as const;
