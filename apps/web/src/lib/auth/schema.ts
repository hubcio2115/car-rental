import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, { error: "Enter your email." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(72, { error: "Password must be at most 72 characters." }),
});
