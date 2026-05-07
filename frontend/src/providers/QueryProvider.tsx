"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

import { queryClient } from "@/lib/query-client";

const ReactQueryDevtools =
  process.env.NODE_ENV === "production"
    ? null
    : dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (mod) => mod.ReactQueryDevtools,
          ),
        {
          ssr: false,
        },
      );

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
