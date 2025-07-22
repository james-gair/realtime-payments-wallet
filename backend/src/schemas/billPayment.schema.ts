import * as z from "zod/v4";

const zodDate = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") {
    return new Date(val);
  }
  return new Date();
}, z.date());

export const billPaymentSchema = z
  .object({
    walletId: z.coerce.number().int(),
    amount: z.coerce.number().gt(0),
    payMethod: z.enum(["bankAcct", "bpay"]),

    // Optional depending on payment method
    billerBsb: z.string().length(6).optional(),
    billerBankAccountNumber: z.string().max(20).optional(),

    billerBpayCode: z.coerce.number().int().optional(),
    billerBpayRef: z.string().max(20).optional(),

    billerDisplayName: z.string().max(40).optional(),
    billDisplayName: z.string().max(40).optional(),

    type: z.enum(["one-time", "recurring"]).default("one-time"),
    frequency: z.enum(["weekly", "fortnightly", "monthly"]).optional(),
    firstPaymentDate: zodDate,

    // Sprint 3
    reminder: z.coerce.boolean().default(false),
    reminderDays: z.coerce.number().int().optional(),
  })
  .refine(
    (data) =>
      data.payMethod !== "bankAcct" ||
      (data.billerBsb && data.billerBankAccountNumber),
    {
      message:
        "BSB and bank account number are required for bank account payments.",
      path: ["billerBsb"],
    }
  )
  .refine(
    (data) =>
      data.payMethod !== "bpay" || (data.billerBpayCode && data.billerBpayRef),
    {
      message: "BPAY code and reference are required for BPAY payments.",
      path: ["billerBpayCode"],
    }
  )
  .refine((data) => data.type !== "recurring" || !!data.frequency, {
    message: "Frequency is required for recurring payments.",
    path: ["frequency"],
  });

export type BillInputs = z.infer<typeof billPaymentSchema>;
