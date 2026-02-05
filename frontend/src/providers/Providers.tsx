"use client";

import { type AbstractIntlMessages } from "next-intl";

import { IntlProvider, MSWProvider, QueryProvider, ThemeProvider } from "@/providers";
import { AuthProvider } from "./AuthProvider";
import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
  messages,
  locale
}: {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale?: string;
}) {
  return (
    <ThemeProvider>
      <IntlProvider messages={messages} locale={locale}>
        <SessionProvider>
          <AuthProvider>
            <MSWProvider>
              <QueryProvider>{children}</QueryProvider>
            </MSWProvider>
          </AuthProvider>
        </SessionProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
