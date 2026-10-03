import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type Env = z.infer<typeof envSchema>;
