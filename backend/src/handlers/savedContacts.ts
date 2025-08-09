import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";
import { AddContactReq } from "../dtos/AddContactReq";
import { lookupPayIDContact } from "../services/payidService";
import { lookupBankAccountContact, lookupJPBankAccountContact } from "../services/bankAccountService";
import { lookupUSBankAccountContact } from "../services/usBankAccountService";

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

    const result = contacts.map(row => {
      const isBank = row.added_by === 'bank_account';
      const parts: string[] = isBank && typeof row.bank_account === 'string' ? row.bank_account.split('-') : [];
      const isAU = isBank && parts[0]?.length === 6 && parts.length === 2;
      const isUS = isBank && parts[0]?.length === 9 && parts.length === 2;
      const isJP = isBank && parts.length === 3; // bankCode-branchCode-accountNumber

      // Normalized contact type classification
      const contactType = row.contact_account_id
        ? 'sendit'
        : isBank
          ? 'bank'
          : (row.added_by === 'email' || row.added_by === 'phone')
            ? 'payid'
            : 'unknown';

      return {
        id: row.id,
        nickname: row.nickname,
        name: row.name,
        username: row.contact_account_id ? row.account_username : null,
        added_by: row.added_by,
        added_value: row.added_value,
        email: contactType === 'bank' ? null : row.email,
        phone: contactType === 'bank' ? null : row.phone,
        bank_account: isBank ? row.bank_account : null,
        contact_account_id: row.contact_account_id,
        contact_type: contactType,
        // Bank account specific fields
        bsb: isAU ? parts[0] : null,
        routing_number: isUS ? parts[0] : null,
        account_number: isBank ? parts[isJP ? 2 : 1] : null,
        jp_bank_code: isJP ? parts[0] : null,
        jp_branch_code: isJP ? parts[1] : null,
        account_holder_name: isBank ? row.name : null,
        account_email: isBank ? row.email : null,
      };
    });

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

export async function deleteContact(req: Request, res: Response): Promise<void> {
  const auth_id = (req as any).user.uid;
  const contactId = parseInt(req.params.contactId);

  if (!contactId || isNaN(contactId)) {
    res.status(400).json({ error: "Valid contact ID is required" });
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

    // Delete the contact
    const result = await sql`
      DELETE FROM saved_contacts 
      WHERE id = ${contactId} AND account_id = ${account_id}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
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

        // Prevent adding the same SendIt account twice
        const existingByContactId = await sql`
          SELECT id FROM saved_contacts 
          WHERE account_id = ${account_id} AND contact_account_id = ${account.account_id}
        `;
        if (existingByContactId.length > 0) {
          res.status(409).json({ error: "Contact already exists" });
          return;
        }

        contactInfo = {
          name,
          added_by: 'username',
          added_value: `@${account.username}`,
          contact_account_id: account.account_id,
          email: account.email,
          phone: account.phone
        };
        break;

      case 'payid':
        // Handle PayID-based contact addition
        const payidInfo = await lookupPayIDContact(contactData.payid);
        
        // Ensure PayID uniqueness per (method,value)
        const existingPayId = await sql`
          SELECT id FROM saved_contacts
          WHERE account_id = ${account_id} AND added_by = ${contactData.payid.includes('@') ? 'email' : 'phone'} AND added_value = ${contactData.payid}
        `;
        if (existingPayId.length > 0) {
          res.status(409).json({ error: "Contact already exists" });
          return;
        }

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
        let bankInfo;
        let addedValue;
        let bankAccountValue;
        
        if (contactData.country === 'AU') {
          if (!contactData.bsb) {
            res.status(400).json({ error: "BSB is required for Australian bank accounts" });
            return;
          }
          bankInfo = await lookupBankAccountContact(contactData.bsb, contactData.accountNumber);
          addedValue = `${contactData.bsb}-${contactData.accountNumber}`;
          bankAccountValue = `${contactData.bsb}-${contactData.accountNumber}`;
        } else if (contactData.country === 'US') {
          if (!contactData.routingNumber) {
            res.status(400).json({ error: "Routing number is required for US bank accounts" });
            return;
          }
          bankInfo = await lookupUSBankAccountContact(contactData.routingNumber, contactData.accountNumber);
          addedValue = `${contactData.routingNumber}-${contactData.accountNumber}`;
          bankAccountValue = `${contactData.routingNumber}-${contactData.accountNumber}`;
        } else if (contactData.country === 'JP') {
          if (!contactData.bankCode || !contactData.branchCode) {
            res.status(400).json({ error: "Bank code and branch code are required for JP bank accounts" });
            return;
          }
          const jpInfo = await lookupJPBankAccountContact(contactData.bankCode, contactData.branchCode, contactData.accountNumber);
          bankInfo = jpInfo;
          // Encode JP as bankCode-branchCode-accountNumber
          addedValue = `${contactData.bankCode}-${contactData.branchCode}-${contactData.accountNumber}`;
          bankAccountValue = addedValue;
        } else {
          res.status(400).json({ error: "Unsupported country for bank account" });
          return;
        }

        // Ensure bank account uniqueness by full encoded bank_account value
        const existingBank = await sql`
          SELECT id FROM saved_contacts
          WHERE account_id = ${account_id} AND added_by = 'bank_account' AND added_value = ${addedValue}
        `;
        if (existingBank.length > 0) {
          res.status(409).json({ error: "Contact already exists" });
          return;
        }
        
        contactInfo = {
          name: contactData.accountHolderName || bankInfo.name,
          added_by: 'bank_account',
          added_value: addedValue,
          bank_account: bankAccountValue,
          email: contactData.accountEmail || bankInfo.email
        };
        break;

      default:
        res.status(400).json({ error: "Invalid contact type" });
        return;
    }

    // Check if contact already exists
    let existingContact;
    if (contactInfo.contact_account_id) {
      // For SendIt accounts, enforce uniqueness by contact_account_id
      existingContact = await sql`
        SELECT id FROM saved_contacts 
        WHERE account_id = ${account_id} AND contact_account_id = ${contactInfo.contact_account_id}
      `;
    } else {
      // For PayID and bank accounts, uniqueness by (added_by, added_value)
      existingContact = await sql`
        SELECT id FROM saved_contacts 
        WHERE account_id = ${account_id} AND added_by = ${contactInfo.added_by} AND added_value = ${contactInfo.added_value}
      `;
    }

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