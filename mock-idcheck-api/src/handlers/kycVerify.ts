import { Request, Response } from "express";
import { KYCVerifyInput, KYCVerifySchema } from "../schemas/kycVerify.schema";
import {
  KYCVerifyInputErrorResponse,
  KYCVerifyResponse,
} from "../dtos/KYCResBody.dtos";
import { ZodIssue } from "zod";
import { mockKYCRecords } from "../sampleData";

export function kycVerifyHandler(
  req: Request,
  res: Response<KYCVerifyResponse>
) {
  // Just to see the req.file
  // In this mock API we don't do anything with this pic
  // In real world, a third party app will check it
  console.log({
    fieldname: req.file?.fieldname,
    originalname: req.file?.originalname,
    mimetype: req.file?.mimetype,
    size: req.file?.size,
  });

  const parseResult = KYCVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation failed",
      issues: parseResult.error.issues as ZodIssue[],
    } satisfies KYCVerifyInputErrorResponse);
    return;
    //  Turns out, if you `return res.status(...).json(...)`,
    // you'll get a type error — not because the code is wrong,
    // but because TypeScript thinks you're returning something
    // other than `void`, which confuses Express’s expectations.
    //  Maybe I should tweak the tsconfig?
    //  Maybe I should just stop being strict
    // and find something better to do with my life.
  }

  const validatedData: KYCVerifyInput = parseResult.data;

  // mock KYC verification
  let result: "verified" | "rejected";
  let findRecord;
  if (validatedData.idType === "passport") {
    findRecord = mockKYCRecords.find(
      (i) =>
        i.countryOfIssue === validatedData.countryOfIssue &&
        new Date(i.dateOfBirth).getTime() ===
          validatedData.dateOfBirth.getTime() &&
        i.fullName === validatedData.fullName &&
        new Date(i.expiryDate).getTime() ===
          validatedData.expiryDate.getTime() &&
        i.passportNumber === validatedData.passportNumber
    );
  } else {
    findRecord = mockKYCRecords.find(
      (i) =>
        i.stateOfIssue === validatedData.stateOfIssue &&
        new Date(i.dateOfBirth).getTime() ===
          validatedData.dateOfBirth.getTime() &&
        i.fullName === validatedData.fullName &&
        new Date(i.expiryDate).getTime() ===
          validatedData.expiryDate.getTime() &&
        i.licenseNumber === validatedData.licenseNumber
    );
  }

  if (!findRecord) result = "rejected";
  else result = "verified";

  // in real world, the risklevel depends on the records i.e, fraud activity...
  res.status(200).json({
    status: result,
    validatedData: validatedData,
    verifiedAt: new Date().toISOString(),
    idType: validatedData.idType,
  });
}
