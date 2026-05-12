import type { LocaleCode } from "@/constants/i18n";
import type { useRouter } from "@/i18n/navigation";

type LocaleRouter = ReturnType<typeof useRouter>;
type SearchParamsLike = {
  toString(): string;
};

export function applyLocaleChange(
  locale: LocaleCode,
  navigation: {
    pathname: string;
    refresh: LocaleRouter["refresh"];
    replace: LocaleRouter["replace"];
    searchParams?: SearchParamsLike;
  }
) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;

  const query = navigation.searchParams?.toString();
  const href = query ? `${navigation.pathname}?${query}` : navigation.pathname;

  navigation.replace(href, { locale });
  navigation.refresh();
}
