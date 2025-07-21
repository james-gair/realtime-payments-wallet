import z from "zod/v4";
// Input validation for the biller info, bank account / bpay
export const billPaymentSchema = z
  .object({
    walletId: z.string().min(1),
    amount: z.coerce.number().positive(),

    payMethod: z.enum(["bankAcct", "bpay"]),

    // Bank Account Fields
    billerBankAccountNumber: z
      .string()
      .regex(/^\d+$/, { message: "Account number must contain digits only" })
      .optional(),
    billerBsb: z
      .string()
      .regex(/^\d{6}$/, { message: "BSB must be exactly 6 digits" })
      .optional(),

    // BPAY Fields
    billerBpayCode: z
      .string()
      .regex(/^\d+$/, { message: "Biller Code must contain digits only" })
      .optional(),
    billerBpayRef: z.string().max(20).optional(),

    // Optional fields
    billerDisplayName: z.string().max(40).optional(),
    billDisplayName: z.string().max(40).optional(),
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
  );
