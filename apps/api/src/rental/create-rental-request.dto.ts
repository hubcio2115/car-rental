import { z } from "zod";

export const createRentalRequestSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .meta({ id: "CreateRentalRequest" });

export type CreateRentalRequest = z.infer<typeof createRentalRequestSchema>;
