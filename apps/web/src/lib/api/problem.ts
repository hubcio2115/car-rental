import * as z from "zod";

const problemDetailSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
});

const bootErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export function springErrorDetail(body: unknown): string | undefined {
  const problem = problemDetailSchema.safeParse(body);
  if (problem.success && problem.data.detail !== undefined) return problem.data.detail;

  const boot = bootErrorSchema.safeParse(body);
  if (boot.success) return boot.data.message ?? boot.data.error;

  return problem.success ? problem.data.title : undefined;
}
