import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";

export async function getSavedContacts(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;

  try {
    const account_id = await getAccountId(auth_id);
    
    const contacts: any[] = await sql`
      SELECT
        sc.id,
        sc.nickname,
        sc.name,
        sc.added_by,
        sc.added_value,
        sc.contact_account_id,
        a.username AS account_username,
        sc.email,
        sc.phone,
        sc.bank_account
      FROM saved_contacts sc
      LEFT JOIN accounts a ON sc.contact_account_id = a.account_id
      WHERE sc.account_id = ${account_id}
      ORDER BY sc.id
    `;
    console.log("Contacts fetched from DB:", contacts);

    const result = contacts.map(row => ({
      id: row.id,
      nickname: row.nickname,
      name: row.name,
      username: row.added_by === 'username' ? row.account_username : null,
      added_by: row.added_by,
      added_value: row.added_value,
      email: row.added_by === 'email' ? row.email : null,
      phone: row.added_by === 'phone' ? row.phone : null,
      bank_account: row.added_by === 'bank_account' ? row.bank_account : null,
    }));

    console.log("Result to send:", result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error retrieving saved contacts", error);
    res.status(500).send({ error: "Failed to retrieve saved contacts" });
  }
}