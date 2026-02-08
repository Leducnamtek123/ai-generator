import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: {
      ...(await import(`../messages/${locale}/common.json`)).default,
      ...(await import(`../messages/${locale}/auth.json`)).default,
      ...(await import(`../messages/${locale}/user.json`)).default,
      ...(await import(`../messages/${locale}/features.json`)).default,
    },
    timeZone: "Asia/Ho_Chi_Minh"
  };
});
