import sql from "../database/client";
import { KYCVerifyInput } from "../dtos/KYCVerifyResponse";

export async function saveVerifiedAccountIdInDb(
  kyc: KYCVerifyInput,
  firebase_id: string
) {
  // find the corresponding account_id
  // using account_id instead of firebase_id -> safer option
  const account = await sql`
    SELECT account_id FROM Account WHERE firebase_id = ${firebase_id}
  `;

  if (account.length === 0) {
    throw new Error("Account not found for this Firebase ID");
  }

  const account_id = account[0].account_id;

  const id_number =
    kyc.idType === "passport" ? kyc.passportNumber : kyc.licenseNumber;

  if (!id_number) {
    throw new Error("Missing ID number");
  }

  return await sql`
    INSERT INTO account_identity (
      account_id,
      full_name,
      date_of_birth,
      id_type,
      id_number,
      expiry_date,
      country_of_issue,
      state_of_issue,
      verified_at
    ) VALUES (
      ${account_id},
      ${kyc.fullName},
      ${kyc.dateOfBirth},
      ${kyc.idType},
      ${id_number},
      ${kyc.expiryDate},
      ${kyc.countryOfIssue ?? null},
      ${kyc.stateOfIssue ?? null},
      ${new Date()}
    )
    RETURNING *
  `;
}
