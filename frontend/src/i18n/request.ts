import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const isVietnamese = locale === "vi";

  const [common, auth, user, features, landing, settings, layout, dashboard, social, notifications, forms, errors] = isVietnamese
    ? await Promise.all([
        import("../messages/vi/common.json"),
        import("../messages/vi/auth.json"),
        import("../messages/vi/user.json"),
        import("../messages/vi/features.json"),
        import("../messages/vi/landing.json"),
        import("../messages/vi/settings.json"),
        import("../messages/vi/layout.json"),
        import("../messages/vi/dashboard.json"),
        import("../messages/vi/social.json"),
        import("../messages/vi/notifications.json"),
        import("../messages/vi/forms.json"),
        import("../messages/vi/errors.json"),
      ])
    : await Promise.all([
        import("../messages/en/common.json"),
        import("../messages/en/auth.json"),
        import("../messages/en/user.json"),
        import("../messages/en/features.json"),
        import("../messages/en/landing.json"),
        import("../messages/en/settings.json"),
        import("../messages/en/layout.json"),
        import("../messages/en/dashboard.json"),
        import("../messages/en/social.json"),
        import("../messages/en/notifications.json"),
        import("../messages/en/forms.json"),
        import("../messages/en/errors.json"),
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
      ...layout.default,
      ...dashboard.default,
      ...social.default,
      ...notifications.default,
      ...forms.default,
      ...errors.default,
    },
    timeZone: "Asia/Ho_Chi_Minh"
  };
});
