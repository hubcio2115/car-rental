import { env } from "~/env";

/** A session cookie, value decoded as Next hands it out. */
export type SessionCookie = { name: string; value: string };

// better-auth's token, a dot, and its base64 HMAC signature.
const PLAUSIBLE_SESSION_TOKEN = /^[A-Za-z0-9]{16,128}\.[A-Za-z0-9+/=_-]{16,128}$/;

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

async function checkWithApi({ name, value }: SessionCookie): Promise<"valid" | "invalid"> {
  const response = await fetch(`${env.API_BASE_URL}/users/me`, {
    method: "GET",
    headers: { cookie: `${name}=${encodeURIComponent(value)}` },
    cache: "no-store",
  });

  return response.ok ? "valid" : "invalid";
}

export async function verifySession(cookie: SessionCookie | undefined): Promise<SessionState> {
  if (cookie === undefined || !PLAUSIBLE_SESSION_TOKEN.test(cookie.value)) return "none";
  const sessionId = cookie.value;

  const now = Date.now();
  let entry = cache.get(sessionId);

  if (entry === undefined || entry.expiresAt <= now) {
    if (cache.size >= MAX_CACHE_ENTRIES) prune(now);
    entry = { expiresAt: now + CACHE_TTL_MS, state: checkWithApi(cookie) };
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
