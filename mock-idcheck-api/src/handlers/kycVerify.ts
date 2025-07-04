import { Request, Response } from "express";
import { KYCVerifyInput, KYCVerifySchema } from "../schemas/kycVerify.schema";
import {
  KYCVerifyInputErrorResponse,
  KYCVerifyResponse,
} from "../dtos/KYCResBody.dtos";
import { ZodIssue } from "zod";

export function kycVerifyHandler(
  req: Request,
  res: Response<KYCVerifyResponse>
) {
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

  // Continue with logic
  // TODO: mock KYC verification

  res.status(200).json({
    status: "verified",
    validatedData: validatedData,
    verifiedAt: new Date().toISOString(),
    idType: "passport",
    riskLevel: "low",
  });
}
