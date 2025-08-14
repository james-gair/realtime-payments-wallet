import sql from "../database/client";

export async function getAccountId(firebase_id: string): Promise<string> {
  const account = await sql`
    SELECT account_id FROM accounts WHERE firebase_id = ${firebase_id}
  `;

  if (account.length === 0) {
    throw new Error("Account not found for this Firebase ID");
  }

  return account[0].account_id.toString();
}

export async function getAccountIdByUsername(
  username: string
): Promise<string> {
  const account = await sql`
    SELECT account_id FROM accounts WHERE username = ${username}
  `;

  if (account.length === 0) {
    throw new Error("Account not found for this username");
  }

  return account[0].account_id.toString();
}
