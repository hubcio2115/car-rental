import { createFetch } from "@better-fetch/fetch";

import { env } from "~/env";

export type Fetcher = typeof $fetch;

/**
 * Browser calls to the API. The session cookie rides along, and the browser's own `Origin`
 * header is what the API checks against CSRF, so no token is needed.
 */
export const $fetch = createFetch({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  throw: false,
  credentials: "include",
});
