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
  "status",
] as const;

export const pageableSchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(12),
  // "model,desc" -> ["model", "desc"] and "model" -> ["model", "asc"], typed as a tuple so no casts
  // downstream. An unknown column or direction falls back to the default instead of failing. The
  // fallbacks sit inside the tuple so the documented input stays a plain string.
  sort: z
    .string()
    .default("id,asc")
    .transform((s) => {
      const [column, direction = "asc"] = s.split(",");
      return [column, direction];
    })
    .pipe(z.tuple([z.enum(sortable).catch("id"), z.enum(["asc", "desc"]).catch("asc")])),
});

export type Pageable = z.infer<typeof pageableSchema>;

const pageMetadataSchema = z
  .object({
    size: z.int(),
    number: z.int(),
    totalElements: z.int(),
    totalPages: z.int(),
  })
  .meta({ id: "PageMetadata" });

/** The paged envelope around `item`, for documenting list responses. */
export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({ content: z.array(item), page: pageMetadataSchema });
}

export type Page<T> = {
  content: T[];
  page: z.infer<typeof pageMetadataSchema>;
};
