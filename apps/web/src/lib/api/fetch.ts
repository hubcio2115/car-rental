import { createFetch } from "@better-fetch/fetch";

import { env } from "~/env";

export type Fetcher = typeof $fetch;

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

let sentCsrfToken: string | undefined;

function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const prefix = `${CSRF_COOKIE}=`;
  const pair = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return pair === undefined ? undefined : decodeURIComponent(pair.slice(prefix.length));
}

export const $fetch = createFetch({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  throw: false,
  credentials: "include",

  retry: {
    type: "linear",
    attempts: 1,
    delay: 0,
    shouldRetry: (response) =>
      response !== null && response.status === 403 && readCsrfToken() !== sentCsrfToken,
  },

  onRequest: (context) => {
    if (SAFE_METHODS.has(context.method.toUpperCase())) return context;

    sentCsrfToken = readCsrfToken();
    if (sentCsrfToken !== undefined) context.headers.set(CSRF_HEADER, sentCsrfToken);

    return context;
  },
});
