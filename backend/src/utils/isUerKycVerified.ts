import sql from "../database/client"; // adjust the path to your sql client

export async function isUserVerified(firebaseId: string): Promise<boolean> {
  const result = await sql`
    SELECT is_verified FROM accounts WHERE firebase_id = ${firebaseId}
  `;

  if (result.length === 0) {
    return false;
  }

  return result[0].is_verified; // This will be a boolean: true or false
}
