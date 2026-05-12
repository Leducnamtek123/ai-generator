"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

import { LOCALES, type LocaleCode } from "@/constants/i18n";

import { applyLocaleChange } from "@/lib/locale-client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/ui";

export function LocaleSwitcher() {
  const currentLocale = useLocale() as LocaleCode;
  const t = useTranslations("LocaleSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locales = Object.keys(LOCALES) as LocaleCode[];

  if (locales.length <= 1) return null;

  const switchLocale = (locale: LocaleCode) => {
    applyLocaleChange(locale, {
      pathname,
      refresh: () => router.refresh(),
      replace: (href, options) => router.replace(href, options),
      searchParams
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full border border-border bg-background text-foreground hover:bg-accent"
          aria-label={t("ariaLabel")}
        >
          <Languages className="size-4" />
          <span className="sr-only">{t("ariaLabel")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            disabled={code === currentLocale}
            onClick={() => {
              if (code === currentLocale) return;
              switchLocale(code);
            }}
          >
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {LOCALES[code].flag}
            </span>
            <span className="flex-1">{LOCALES[code].label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
