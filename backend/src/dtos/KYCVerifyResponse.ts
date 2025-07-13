export interface KYCVerifyInput {
  idType: "passport" | "drivers_license";
  fullName: string;
  dateOfBirth: Date | string;
  expiryDate: Date | string;
  passportNumber?: string | undefined;
  licenseNumber?: string | undefined;
  stateOfIssue?: string | undefined;
  countryOfIssue?: string | undefined;
}

export interface KYCVerifyResultResponse {
  result: "verified" | "rejected";
  validatedData: KYCVerifyInput;
  verifiedAt: string; // ISO timestamp string
  idType: "passport" | "drivers_license";
}
