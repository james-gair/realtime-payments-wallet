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
      SELECT account_id FROM accounts WHERE username = ${recipient}
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

// get all the payment requests that have been requested to the users 

export async function getReceivedPaymentRequests(req: Request, res: Response): Promise<void> {
  try {
    const firebaseId = (req as any).user?.uid;
    if (!firebaseId) {
      res.status(401).json({ error: "Unauthorized: No user info" });
      return;
    }

    // Get account_id for the current user
    const userResult = await sql`
      SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}
    `;

    if (userResult.length === 0) {
      res.status(404).json({ error: "User account not found" });
      return;
    }

    const { account_id } = userResult[0];

    // Get all payment requests where this user is the recipient (account_id_to)
    const paymentRequests = await sql`
      SELECT * FROM payment_request
      WHERE account_id_to = ${account_id}
      ORDER BY created_at DESC
    `;

    res.status(200).json({ data: paymentRequests });
  } catch (error) {
    console.error("Error fetching received payment requests:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

// get all the payment requests that have been sent by the current user

export async function getSentPaymentRequests(req: Request, res: Response): Promise<void> {
  try {
    const firebaseId = (req as any).user?.uid;
    if (!firebaseId) {
      res.status(401).json({ error: "Unauthorized: No user info" });
      return;
    }

    // Get account_id for the current user
    const userResult = await sql`
      SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}
    `;

    if (userResult.length === 0) {
      res.status(404).json({ error: "User account not found" });
      return;
    }

    const { account_id } = userResult[0];

    // Get all payment requests where this user is the sender (account_id_from)
    const sentRequests = await sql`
      SELECT 
        pr.*,                  
        a.username AS recipient_username  
      FROM payment_request pr
      JOIN accounts a ON pr.account_id_to = a.account_id
      WHERE pr.account_id_from = ${account_id}
      ORDER BY pr.created_at DESC
    `;

    console.log("Sent payment requests for account_id:", account_id);
    console.log(sentRequests);

    res.status(200).json({ data: sentRequests });
  } catch (error) {
    console.error("Error fetching sent payment requests:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

// be able to delete a payment request: the payment request needs to be sent by the current user and the payment requests needs to have status pending
export async function deletePaymentRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params; // id of the payment request

    const firebaseId = (req as any).user?.uid;
    if (!firebaseId) {
      res.status(401).json({ error: "Unauthorized: No user info" });
      return;
    }

    // Get account_id for the current user
    const userResult = await sql`
      SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}
    `;

    if (userResult.length === 0) {
      res.status(404).json({ error: "User account not found" });
      return;
    }

    const { account_id } = userResult[0];

    // Verify the request exists and belongs to the user, and is still pending
    const requestResult = await sql`
      SELECT * FROM payment_request
      WHERE id = ${id} AND account_id_from = ${account_id} AND status = 'pending'
    `;

    if (requestResult.length === 0) {
      res.status(404).json({ error: "Payment request not found or not cancellable." });
      return;
    }

    // Delete the payment request
    await sql`
      DELETE FROM payment_request WHERE id = ${id}
    `;

    res.status(200).json({ message: "Payment request cancelled successfully." });
  } catch (error) {
    console.error("Error deleting payment request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}