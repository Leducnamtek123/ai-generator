"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LOCALES, type LocaleCode } from "@/constants/i18n";

import { usePathname, useRouter } from "@/i18n/navigation";

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
  const { replace, refresh } = useRouter();
  const pathname = usePathname();
  const locales = Object.keys(LOCALES) as LocaleCode[];

  if (locales.length <= 1) return null;

  const switchLocale = (locale: LocaleCode) => {
    replace(pathname, { locale });
    refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
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
            onSelect={(event) => {
              event.preventDefault();
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
