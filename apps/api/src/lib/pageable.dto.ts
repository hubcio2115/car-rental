import { z } from "zod";

const sortable = [
  "id",
  "model",
  "year",
  "type",
  "registrationNumber",
  "seats",
  "doors",
  "pricePerDay",
] as const;

export const pageableSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(12),
  // "model,desc" -> ["model", "desc"], typed as a tuple so no casts downstream
  sort: z
    .string()
    .default("id,asc")
    .transform((s) => s.split(","))
    .pipe(z.tuple([z.enum(sortable), z.enum(["asc", "desc"])])),
});

export type Pageable = z.infer<typeof pageableSchema>;

export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};
