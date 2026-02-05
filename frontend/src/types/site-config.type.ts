export interface SocialLinksType {
  twitter: string;
  github: string;
  linkedin: string;
}

export interface SiteConfigType {
  name: string;
  description: string;
  url: string;
  author: string;
  locale: string;
  themeColor: string;
  keywords: string[];
  social: SocialLinksType;
  ogImage: string;
  languages: Record<string, string>;
}
