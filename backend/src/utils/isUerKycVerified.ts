import sql from "../database/client"; // adjust the path to your sql client

export async function isUserVerified(firebaseId: string): Promise<boolean> {
  const result = await sql`
    SELECT verified FROM Account WHERE firebase_id = ${firebaseId}
  `;

  if (result.length === 0) {
    return false;
  }

  return result[0].verified; // This will be a boolean: true or false
}
