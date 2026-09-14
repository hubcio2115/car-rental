import "server-only";

import { createFetch } from "@better-fetch/fetch";
import { cookies } from "next/headers";

import { env } from "~/env";
import { readSetCookies } from "./set-cookie";

const RELAYED_COOKIES = ["JSESSIONID", "XSRF-TOKEN"] as const;
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";

function mintsCsrfToken(response: Response): boolean {
  return response.headers.getSetCookie().some((header) => header.startsWith(`${CSRF_COOKIE}=`));
}

export const $serverFetch = createFetch({
  baseURL: env.API_BASE_URL,
  throw: false,
  cache: "no-store",

  retry: {
    type: "linear",
    attempts: 1,
    delay: 0,
    shouldRetry: (response) =>
      response !== null && response.status === 403 && mintsCsrfToken(response),
  },

  onRequest: async (context) => {
    const store = await cookies();

    const relayed = RELAYED_COOKIES.map((name) => {
      const value = store.get(name)?.value;
      return value === undefined ? undefined : `${name}=${value}`;
    }).filter((pair) => pair !== undefined);

    if (relayed.length > 0) context.headers.set("Cookie", relayed.join("; "));

    const token = store.get(CSRF_COOKIE)?.value;
    if (token !== undefined) context.headers.set(CSRF_HEADER, token);

    return context;
  },

  onResponse: async ({ response }) => {
    const incoming = readSetCookies(response);
    if (incoming.length === 0) return;

    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";

    for (const cookie of incoming) {
      try {
        store.set(cookie.name, cookie.value, {
          path: cookie.path,
          httpOnly: cookie.name !== CSRF_COOKIE,
          secure,
          sameSite: "lax",
          ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
          ...(cookie.expires !== undefined ? { expires: cookie.expires } : {}),
        });
      } catch {
        return;
      }
    }
  },
});
