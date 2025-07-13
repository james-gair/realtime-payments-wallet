import * as z from "zod/v4";

const zodDate = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date",
  });

export const kycSchema = z.object({
  idType: z.enum(["passport", "driver_license"]),
  fullName: z.string().nonempty("Fullname is required."),
  dateOfBirth: zodDate,
  idExpDate: zodDate,
  idNumber: z.string().nonempty("ID number is required."),
  placeOfIssue: z.string().nonempty("Place of issue is required."),
});

export type KycInput = z.infer<typeof kycSchema>;
