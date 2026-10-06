import { z } from "zod";

/** Path params arrive as strings, so ids are coerced before validating. */
export const idParam = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
