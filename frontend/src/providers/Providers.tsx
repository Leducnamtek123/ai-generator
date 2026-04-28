"use client";

import { type AbstractIntlMessages } from "next-intl";

import { IntlProvider, MSWProvider, QueryProvider, ThemeProvider, SocketProvider } from "@/providers";
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
            <SocketProvider>
              {/* <MSWProvider> */}
              <QueryProvider>{children}</QueryProvider>
              {/* </MSWProvider> */}
            </SocketProvider>
          </AuthProvider>
        </SessionProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
