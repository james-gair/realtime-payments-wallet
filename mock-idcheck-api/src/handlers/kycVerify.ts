import { Request, Response } from "express";
import {
  KYCVerifyInputErrorResponse,
  KYCVerifyResponse,
} from "../dtos/KYCResBody.dtos";
import { ZodIssue } from "zod";
import { mockKYCRecords } from "../sampleData";
import { KYCVerifyInput, KYCVerifySchema } from "../schemas/kycVerify.schema";

export function kycVerifyHandler(
  req: Request,
  res: Response<KYCVerifyResponse>
) {
  // Just to see the req.file
  // In this mock API we don't do anything with this pic
  // In real world, a third party app will check it
  const files = req.files as {
    idPhoto?: Express.Multer.File[];
    selfieWithId?: Express.Multer.File[];
  };

  const idPhoto = files.idPhoto?.[0];
  const selfie = files.selfieWithId?.[0];

  if (!idPhoto || !selfie) {
    res.status(400).json({
      error: "Validation failed",
      issues: "Both ID photo and selfie are required",
    });
    return;
  }
  // check the inputs
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
  const findRecord = mockKYCRecords.find(
    (i) =>
      i.idType.toUpperCase() === validatedData.idType.toUpperCase() &&
      i.placeOfIssue?.toUpperCase() ===
        validatedData.placeOfIssue?.toUpperCase() &&
      new Date(i.dateOfBirth).getTime() ===
        new Date(validatedData.dateOfBirth).getTime() &&
      i.fullName.toUpperCase() === validatedData.fullName.toUpperCase() &&
      new Date(i.idExpDate).getTime() ===
        new Date(validatedData.idExpDate).getTime() &&
      i.idNumber?.toString().toUpperCase() ===
        validatedData.idNumber?.toString().toUpperCase()
  );

  if (!findRecord) result = "rejected";
  else result = "verified";

  res.status(200).json({
    result: result,
    validatedData: validatedData,
    verifiedAt: new Date().toISOString(),
    idType: validatedData.idType,
  });
}
