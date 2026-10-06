import "server-only";

import { createFetch } from "@better-fetch/fetch";
import { cookies, headers } from "next/headers";

import { env } from "~/env";
import { isAuthCookie } from "~/lib/auth/session-cookie";
import { readSetCookies } from "./set-cookie";

/**
 * Server-side calls to the API, acting as the browser: better-auth's cookies are relayed both
 * ways, and the browser's `Origin` is forwarded, since the API refuses cookie-bearing writes
 * from anywhere but the web app.
 */
export const $serverFetch = createFetch({
  baseURL: env.API_BASE_URL,
  throw: false,
  cache: "no-store",

  onRequest: async (context) => {
    const store = await cookies();

    const relayed = store
      .getAll()
      .filter((cookie) => isAuthCookie(cookie.name))
      .map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`);

    if (relayed.length > 0) context.headers.set("Cookie", relayed.join("; "));

    // Server actions always carry it. Plain renders don't, but they only read.
    const origin = (await headers()).get("origin");
    if (origin !== null) context.headers.set("Origin", origin);

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
          httpOnly: true,
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
