import * as z from "zod/v4";

const zodDate = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date",
  });

export const KYCVerifySchema = z
  .object({
    idType: z.enum(["passport", "drivers_license"]),
    fullName: z.string().min(1),
    dateOfBirth: zodDate,
    expiryDate: zodDate,
    passportNumber: z.string().optional(),
    licenseNumber: z.string().optional(),
    stateOfIssue: z.string().optional(),
    countryOfIssue: z.string().optional(),
  })
  .refine(
    (data) =>
      data.idType !== "passport" ||
      (data.passportNumber &&
        data.passportNumber.length > 0 &&
        data.countryOfIssue &&
        data.countryOfIssue.length > 0),
    {
      message:
        "Passport number and country of issue is required if type is passport",
      path: ["passportNumber"],
    }
  )
  .refine(
    (data) =>
      data.idType !== "drivers_license" ||
      (data.licenseNumber &&
        data.licenseNumber.length > 0 &&
        data.stateOfIssue &&
        data.stateOfIssue.length > 0),
    {
      message:
        "License number and state of issue is required if type is drivers_license",
      path: ["licenseNumber"],
    }
  );

export type KYCVerifyInput = z.infer<typeof KYCVerifySchema>;
