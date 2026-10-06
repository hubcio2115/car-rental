/**
 * better-auth's session cookie. The API adds the `__Secure-` prefix when it runs on https.
 * Values are kept decoded, the way Next's cookie store hands them out; encode before sending.
 */
export const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

/** Any cookie better-auth sets, which is what we relay between the browser and the API. */
export function isAuthCookie(name: string): boolean {
  return /^(?:__Secure-)?better-auth\./.test(name);
}
