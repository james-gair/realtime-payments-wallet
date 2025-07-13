import { kycInput } from "../schemas/kyc.schema";

export interface KYCVerifyResultResponse {
  result: "verified" | "rejected";
  validatedData: kycInput;
  verifiedAt: string; // ISO timestamp string
  idType: "passport" | "driver_license";
}
