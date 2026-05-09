import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const isVietnamese = locale === "vi";

  const [common, auth, user, features, landing, settings] = isVietnamese
    ? await Promise.all([
        import("../messages/vi/common.json"),
        import("../messages/vi/auth.json"),
        import("../messages/vi/user.json"),
        import("../messages/vi/features.json"),
        import("../messages/vi/landing.json"),
        import("../messages/vi/settings.json"),
      ])
    : await Promise.all([
        import("../messages/en/common.json"),
        import("../messages/en/auth.json"),
        import("../messages/en/user.json"),
        import("../messages/en/features.json"),
        import("../messages/en/landing.json"),
        import("../messages/en/settings.json"),
      ]);

  return {
    locale,
    messages: {
      ...common.default,
      ...auth.default,
      ...user.default,
      ...features.default,
      ...landing.default,
      ...settings.default,
    },
    timeZone: "Asia/Ho_Chi_Minh"
  };
});
