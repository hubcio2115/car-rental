/** A `Set-Cookie` from Spring, reduced to the attributes we are willing to mirror. */
export type SpringCookie = {
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
 * describe Spring's origin, and not reading them is what guarantees we cannot forward
 * them onto ours by accident. See `$serverFetch`'s onResponse for what we set instead.
 */
export function parseSetCookie(header: string): SpringCookie | null {
  const [pair, ...attributes] = header.split(";");
  if (pair === undefined) return null;

  // Split at the FIRST "=" only: base64 CSRF token values contain "=".
  const separator = pair.indexOf("=");
  if (separator <= 0) return null;

  const name = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();
  if (name === "") return null;

  const cookie: SpringCookie = { name, value, path: "/" };

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
export function readSetCookies(response: Response): SpringCookie[] {
  return response.headers
    .getSetCookie()
    .map(parseSetCookie)
    .filter((cookie) => cookie !== null);
}
