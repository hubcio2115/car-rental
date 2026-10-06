import * as z from "zod";

// Nest errors are `{ statusCode, message, error }` and better-auth's are `{ code, message }`.
// Nest validation errors can carry several messages.
const apiErrorSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
});

/** The human readable message of an API error body, if it has one. */
export function apiErrorDetail(body: unknown): string | undefined {
  const parsed = apiErrorSchema.safeParse(body);
  if (!parsed.success) return undefined;

  const { message } = parsed.data;
  return Array.isArray(message) ? message.join(" ") : message;
}
