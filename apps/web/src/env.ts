import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/**
 * Server-only environment. `API_BASE_URL` is deliberately not `NEXT_PUBLIC_`: only the
 * Next server talks to Spring, so prefixing it would inline the backend URL into the
 * client bundle for no reason. The default keeps `next build` working with no env file.
 */
export const env = createEnv({
  server: {
    API_BASE_URL: z.httpUrl().default("http://localhost:8080"),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {},
});
