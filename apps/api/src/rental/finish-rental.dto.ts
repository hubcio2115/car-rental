import { z } from "zod";

export const finishRentalRequest = z
  .object({ endDate: z.iso.date() })
  .meta({ id: "FinishRentalRequest" });

export type FinishRentalRequest = z.infer<typeof finishRentalRequest>;
