import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";
import { AddContactReq } from "../dtos/AddContactReq";
import { lookupPayIDContact } from "../services/payidService";
import { lookupBankAccountContact } from "../services/bankAccountService";

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
      contact_account_id: row.contact_account_id,
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

export async function addContact(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;
  const contactData: AddContactReq = req.body;

  try {
    const account_id = await getAccountId(auth_id);

    let contactInfo: {
      name: string;
      added_by: string;
      added_value: string;
      contact_account_id?: number;
      email?: string;
      phone?: string;
      bank_account?: string;
    };

    switch (contactData.type) {
      case 'account':
        // Handle account-based contact addition
        const { searchValue, nickname } = contactData;
        
        if (!searchValue) {
          res.status(400).json({ error: "Search value is required" });
          return;
        }

        // Find the account by username, phone, or email
        let accountQuery;
        if (searchValue.startsWith('@')) {
          // Username search (remove @ symbol)
          const username = searchValue.substring(1);
          accountQuery = await sql`SELECT account_id, username, first_name, last_name, email, phone FROM accounts WHERE username = ${username}`;
        } else if (searchValue.includes('@')) {
          // Email search
          accountQuery = await sql`SELECT account_id, username, first_name, last_name, email, phone FROM accounts WHERE email = ${searchValue}`;
        } else {
          // Phone search
          accountQuery = await sql`SELECT account_id, username, first_name, last_name, email, phone FROM accounts WHERE phone = ${searchValue}`;
        }

        if (accountQuery.length === 0) {
          res.status(404).json({ error: "Account not found" });
          return;
        }

        const account = accountQuery[0];
        const name = `${account.first_name} ${account.last_name}`.trim();
        
        contactInfo = {
          name,
          added_by: searchValue.startsWith('@') ? 'username' : searchValue.includes('@') ? 'email' : 'phone',
          added_value: searchValue,
          contact_account_id: account.account_id,
          email: account.email,
          phone: account.phone
        };
        break;

      case 'payid':
        // Handle PayID-based contact addition
        const payidInfo = await lookupPayIDContact(contactData.payid);
        
        contactInfo = {
          name: payidInfo.name,
          added_by: contactData.payid.includes('@') ? 'email' : 'phone',
          added_value: contactData.payid,
          email: payidInfo.email,
          phone: payidInfo.phone
        };
        break;

      case 'bank_account':
        // Handle bank account-based contact addition
        const bankInfo = await lookupBankAccountContact(contactData.bsb, contactData.accountNumber);
        
        contactInfo = {
          name: bankInfo.name,
          added_by: 'bank_account',
          added_value: `${contactData.bsb}-${contactData.accountNumber}`,
          bank_account: `${contactData.bsb}-${contactData.accountNumber}`
        };
        break;

      default:
        res.status(400).json({ error: "Invalid contact type" });
        return;
    }

    // Check if contact already exists
    const existingContact = await sql`
      SELECT id FROM saved_contacts 
      WHERE account_id = ${account_id} AND added_by = ${contactInfo.added_by} AND added_value = ${contactInfo.added_value}
    `;

    if (existingContact.length > 0) {
      res.status(409).json({ error: "Contact already exists" });
      return;
    }

    // Insert into saved_contacts table
    const result = await sql`
      INSERT INTO saved_contacts (
        account_id,
        contact_account_id,
        nickname,
        name,
        added_by,
        added_value,
        email,
        phone,
        bank_account
      ) VALUES (
        ${account_id},
        ${contactInfo.contact_account_id || null},
        ${contactData.nickname || null},
        ${contactInfo.name},
        ${contactInfo.added_by},
        ${contactInfo.added_value},
        ${contactInfo.email || null},
        ${contactInfo.phone || null},
        ${contactInfo.bank_account || null}
      )
      RETURNING id;
    `;

    if (result.length === 0) {
      res.status(500).json({ error: "Failed to add contact" });
      return;
    }
    
    res.status(200).json({ 
      contactId: result[0].id,
      name: contactInfo.name,
      added_by: contactInfo.added_by,
      added_value: contactInfo.added_value
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ error: "Failed to add contact" });
  }
}