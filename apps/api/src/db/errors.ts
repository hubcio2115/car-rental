import { DatabaseError } from "pg";

/**
 * Unwraps the pg error behind a failed query (drizzle wraps it as `cause`), so callers can map
 * constraint names or SQLSTATE codes onto HTTP errors.
 */
export function pgError(err: unknown): DatabaseError | undefined {
  const candidate = err instanceof Error && err.cause instanceof DatabaseError ? err.cause : err;
  return candidate instanceof DatabaseError ? candidate : undefined;
}
