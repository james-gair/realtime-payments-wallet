import { Request, Response } from "express";
import sql from "../database/client";

export async function postPaymentRequest(req: Request, res: Response):  Promise<void> {
  try {
    const { recipient, amount, description } = req.body;

    // Get Firebase UID from middleware auth

    const firebaseId = (req as any).user?.uid;
    if (!firebaseId) {
      res.status(401).json({ error: "Unauthorized: No user info" });
      return;
    }

    // Lookup sender info from accounts table by firebase_id
    const senderResult = await sql`
      SELECT account_id, username FROM accounts WHERE firebase_id = ${firebaseId}
    `;

    if (senderResult.length === 0) {
      res.status(404).json({ error: "Sender not found" });
      return;
    }

    const { account_id: account_id_from, username: username_from } = senderResult[0];
    // Validate required fields
    if (!recipient || !amount || !description) {
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    // Lookup recipient's account_id
    const recipientUser = await sql`
      SELECT account_id FROM users WHERE username = ${recipient}
    `;

    if (recipientUser.length === 0) {
      res.status(404).json({ error: "Recipient not found." });
      return;
    }

    const account_id_to = recipientUser[0].account_id;

    // Insert into payment_request table
    const result = await sql`
      INSERT INTO payment_request (
        account_id_from,
        username_from,
        account_id_to,
        amount,
        description,
        status
      ) VALUES (
        ${account_id_from},
        ${username_from},
        ${account_id_to},
        ${amount},
        ${description},
        'pending'
      )
      RETURNING *
    `;

    res.status(201).json({ message: "Payment request created.", data: result[0] });
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}