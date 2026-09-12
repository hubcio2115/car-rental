import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    API_BASE_URL: z.httpUrl().default("http://localhost:8080"),
  },
  client: {
    NEXT_PUBLIC_API_BASE_URL: z.httpUrl().default("http://localhost:8080"),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
});
