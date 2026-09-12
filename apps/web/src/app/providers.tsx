"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "$components/theme-provider";
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "$lib/get-query-client";

export function Providers({ children }: PropsWithChildren) {
  const qc = getQueryClient();

  return (
    <ThemeProvider>
      <NuqsAdapter>
        <QueryClientProvider client={qc}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
