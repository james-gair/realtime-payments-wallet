import { z } from "zod";

const LimitInputSchema = z.object({
  walletId: z.string(),
  limit: z.number().nonnegative(),
});

export const LimitsSchema = z.object({
  limits: z.array(LimitInputSchema),
});

export type PaymentLimitsArray = z.infer<typeof LimitsSchema>;
