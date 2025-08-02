import sql from "../database/client";

export async function updataKycVerificationStatus(firebase_id: string) {
  const result = await sql`
      UPDATE accounts
      SET is_verified = true
      WHERE firebase_id = ${firebase_id}
    `;

  return result.count > 0;
}
