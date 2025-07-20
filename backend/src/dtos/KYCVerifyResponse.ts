import { KycInput } from "../schemas/kyc.schema";

export interface KYCVerifyResultResponse {
  result: "verified" | "rejected";
  validatedData: KycInput;
  verifiedAt: string; // ISO timestamp string
  idType: "passport" | "driver_license";
}
