import { ZodIssue } from "zod";
import { KYCVerifyInput } from "../schemas/kycVerify.schema";

export interface KYCVerifyResultResponse {
  result: "verified" | "rejected";
  validatedData: KYCVerifyInput;
  verifiedAt: string; // ISO timestamp string
  idType: "passport" | "driver_license";
}

export interface KYCVerifyInputErrorResponse {
  error: string;
  issues: ZodIssue[] | string;
}

export type KYCVerifyResponse =
  | KYCVerifyResultResponse
  | KYCVerifyInputErrorResponse;
