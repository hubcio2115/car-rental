import { createFetch } from "@better-fetch/fetch";

import { env } from "~/env";

export type Fetcher = typeof $fetch;

export const $fetch = createFetch({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  throw: false,
  credentials: "include",
});
