import * as z from "zod/v4";

const zodDate = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date",
  });

export const kycSchema = z
  .object({
    idType: z.enum(["passport", "drivers_license"]),
    fullName: z.string().min(1),
    dateOfBirth: zodDate,
    passportExpiry: zodDate.optional(),
    passportNumber: z.string().optional(),
    licenseNumber: z.string().optional(),
    stateOfIssue: z.string().optional(),
    countryOfIssue: z.string().optional(),
    licenseExpiry: zodDate.optional(),
  })
  .refine(
    (data) =>
      data.idType !== "passport" ||
      (data.passportNumber && data.passportNumber.length > 0) ||
      (data.countryOfIssue && data.countryOfIssue.length > 0) ||
      data.passportExpiry,
    {
      message: "All the related fields are required if type is passport",
      path: ["passportNumber"],
    }
  )
  .refine(
    (data) =>
      data.idType !== "drivers_license" ||
      (data.licenseNumber && data.licenseNumber.length > 0) ||
      (data.stateOfIssue && data.stateOfIssue.length > 0) ||
      data.licenseExpiry,
    {
      message: "All the related fields are required if type is drivers_license",
      path: ["licenseNumber"],
    }
  );

export type kycInput = z.infer<typeof kycSchema>;
