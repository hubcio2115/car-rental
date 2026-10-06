/** A `Set-Cookie` from the API, reduced to the attributes we are willing to mirror. */
export type ApiCookie = {
  name: string;
  value: string;
  path: string;
  maxAge?: number;
  expires?: Date;
};

/**
 * Parses one `Set-Cookie` header value. Returns `null` for anything malformed rather
 * than throwing, so one bad header cannot fail a login.
 *
 * `domain`, `secure`, `samesite` and `httponly` are deliberately not parsed: those
 * describe the API's origin, and not reading them is what guarantees we cannot forward
 * them onto ours by accident. See `$serverFetch`'s onResponse for what we set instead.
 *
 * The value comes back decoded: Next's cookie store encodes on write, so storing it encoded
 * would double-encode better-auth's signed token and break its signature.
 */
export function parseSetCookie(header: string): ApiCookie | null {
  const [pair, ...attributes] = header.split(";");
  if (pair === undefined) return null;

  // Split at the FIRST "=" only: signed token values can contain "=".
  const separator = pair.indexOf("=");
  if (separator <= 0) return null;

  const name = pair.slice(0, separator).trim();
  const value = decodeValue(pair.slice(separator + 1).trim());
  if (name === "" || value === null) return null;

  const cookie: ApiCookie = { name, value, path: "/" };

  for (const attribute of attributes) {
    const split = attribute.indexOf("=");
    const key = (split === -1 ? attribute : attribute.slice(0, split)).trim().toLowerCase();
    const raw = split === -1 ? "" : attribute.slice(split + 1).trim();

    if (key === "path" && raw !== "") {
      cookie.path = raw;
    } else if (key === "max-age") {
      const maxAge = Number.parseInt(raw, 10);
      if (!Number.isNaN(maxAge)) cookie.maxAge = maxAge;
    } else if (key === "expires") {
      const expires = new Date(raw);
      if (!Number.isNaN(expires.getTime())) cookie.expires = expires;
    }
  }

  return cookie;
}

/**
 * Reads every `Set-Cookie` off a response. `headers.get("set-cookie")` folds them into
 * one comma-joined string, and `Expires=Wed, 21 Oct ...` contains a comma, so splitting
 * that back apart is unrecoverable. `getSetCookie()` is the only correct read.
 */
export function readSetCookies(response: Response): ApiCookie[] {
  return response.headers
    .getSetCookie()
    .map(parseSetCookie)
    .filter((cookie) => cookie !== null);
}

function decodeValue(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
