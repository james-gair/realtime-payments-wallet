import sql from "../database/client";
import { KycInput } from "../schemas/kyc.schema";

export async function saveVerifiedAccountIdInDb(
  kyc: KycInput,
  firebase_id: string
) {
  // find the corresponding account_id
  // using account_id instead of firebase_id -> safer option
  const account = await sql`
    SELECT account_id FROM accounts WHERE firebase_id = ${firebase_id}
  `;

  if (account.length === 0) {
    throw new Error("Account not found for this Firebase ID");
  }

  const account_id = account[0].account_id;

  return await sql`
    INSERT INTO account_identities (
      account_id,
      full_name,
      date_of_birth,
      id_type,
      id_number,
      id_expiry_date,
      place_of_issue,
      verified_at
    ) VALUES (
      ${account_id},
      ${kyc.fullName},
      ${kyc.dateOfBirth},
      ${kyc.idType},
      ${kyc.idNumber},
      ${kyc.idExpDate},
      ${kyc.placeOfIssue},
      ${new Date()}
    )
    RETURNING *
  `;
}
