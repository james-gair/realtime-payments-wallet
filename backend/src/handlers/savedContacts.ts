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
    console.error("Error retrieving saved contacts:", error);
    res.status(500).send({ error: "Failed to retrieve saved contacts" });
  }
}

export async function updateContactNickname(req: Request, res: Response): Promise<void> {
  const auth_id = (req as any).user.uid;
  const { contactId, nickname } = req.body;

  if (!contactId || typeof contactId !== 'number') {
    res.status(400).json({ error: "Contact ID is required and must be a number" });
    return;
  }

  if (nickname !== undefined && (typeof nickname !== 'string' || nickname.length > 50)) {
    res.status(400).json({ error: "Nickname must be a string and cannot exceed 50 characters" });
    return;
  }

  try {
    const account_id = await getAccountId(auth_id);
    
    // Check if the contact belongs to the user
    const existingContact = await sql`
      SELECT id FROM saved_contacts 
      WHERE id = ${contactId} AND account_id = ${account_id}
    `;

    if (existingContact.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    // Update the nickname
    const result = await sql`
      UPDATE saved_contacts 
      SET nickname = ${nickname || null}
      WHERE id = ${contactId} AND account_id = ${account_id}
      RETURNING id, nickname, name
    `;

    if (result.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    res.status(200).json({
      id: result[0].id,
      nickname: result[0].nickname,
      name: result[0].name
    });
  } catch (error) {
    console.error("Error updating contact nickname:", error);
    res.status(500).json({ error: "Failed to update contact nickname" });
  }
}