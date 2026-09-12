import { env } from "~/env";

export const SESSION_COOKIE = "JSESSIONID";

const PLAUSIBLE_SESSION_ID = /^[0-9a-f]{16,128}(?:\.[\w-]{1,64})?$/i;

const CACHE_TTL_MS = 5 * 60 * 1000;

/** Bounds the map so a flood of distinct cookies cannot grow it without limit. */
const MAX_CACHE_ENTRIES = 1000;

export type SessionState = "none" | "valid" | "invalid" | "unreachable";

interface CacheEntry {
  expiresAt: number;
  /** Stored unresolved so concurrent requests for one session share a single call. */
  state: Promise<"valid" | "invalid">;
}

const cache = new Map<string, CacheEntry>();

function prune(now: number): void {
  for (const [sessionId, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(sessionId);
  }
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
}

async function checkWithApi(sessionId: string): Promise<"valid" | "invalid"> {
  const response = await fetch(`${env.API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: { cookie: `${SESSION_COOKIE}=${sessionId}` },
    cache: "no-store",
  });

  return response.ok ? "valid" : "invalid";
}

export async function verifySession(sessionId: string | undefined): Promise<SessionState> {
  if (sessionId === undefined || !PLAUSIBLE_SESSION_ID.test(sessionId)) return "none";

  const now = Date.now();
  let entry = cache.get(sessionId);

  if (entry === undefined || entry.expiresAt <= now) {
    if (cache.size >= MAX_CACHE_ENTRIES) prune(now);
    entry = { expiresAt: now + CACHE_TTL_MS, state: checkWithApi(sessionId) };
    cache.set(sessionId, entry);
  }

  try {
    return await entry.state;
  } catch (error) {
    cache.delete(sessionId);
    console.error("[auth] session check could not reach the API", error);
    return "unreachable";
  }
}
