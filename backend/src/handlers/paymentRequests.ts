import { Request, Response } from "express";
import sql from "../database/client";
import { postSendMoney } from "./sendMoney";

export async function postPaymentRequest(req: Request, res: Response):  Promise<void> {
  try {
    const { recipientId, amount, description, currencyCode = "AUD" } = req.body;

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
      console.log("sender wasnt found");
      res.status(404).json({ error: "Sender not found" });
      return;
    }

    const { account_id: account_id_from, username: username_from } = senderResult[0];
    // Validate required fields
     if (!recipientId || !amount) {
      console.log("missing fields");
      res.status(400).json({ error: "Missing required fields." });
      return;
    }

    // Lookup recipient's account_id and username

  const recipientUser = await sql`
    SELECT account_id, username FROM accounts WHERE account_id = ${recipientId}
    `;


    if (recipientUser.length === 0) {
      console.log("got here recipent not found");
      res.status(404).json({ error: "Recipient not found." });
      return;
    }

    const { account_id: account_id_to, username: username_to } = recipientUser[0];

    // Get currency ID
    const currencyResult = await sql`
      SELECT currency_id FROM currencies WHERE code = ${currencyCode}
    `;

    if (currencyResult.length === 0) {
      res.status(400).json({ error: "Invalid currency code." });
      return;
    }

    const currencyId = currencyResult[0].currency_id;
    // Insert into payment_requests table
    const result = await sql`
      INSERT INTO payment_requests (
        account_id_from,
        username_from,
        account_id_to,
        username_to,
        amount,
        currency_id,
        description,
        status
      ) VALUES (
        ${account_id_from},
        ${username_from},
        ${account_id_to},
        ${username_to},
        ${amount},
        ${currencyId},
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

    // Get all payment requests where this user is the recipient (account_id_to) that havent been settled
    const paymentRequests = await sql`
      SELECT * FROM payment_requests
      WHERE account_id_to = ${account_id} AND status = 'pending'
      ORDER BY created_at DESC
    `;
    console.log("Fetched payment requests:", paymentRequests);

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
      FROM payment_requests pr
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
      SELECT * FROM payment_requests
      WHERE id = ${id} AND account_id_from = ${account_id} AND status = 'pending'
    `;

    if (requestResult.length === 0) {
      res.status(404).json({ error: "Payment request not found or not cancellable." });
      return;
    }

    // Delete the payment request
    await sql`
      DELETE FROM payment_requests WHERE id = ${id}
    `;

    res.status(200).json({ message: "Payment request cancelled successfully." });
  } catch (error) {
    console.error("Error deleting payment request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

// Settle a payment request by transferring money from recipient to requester

export async function settlePaymentRequest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const firebaseId = (req as any).user?.uid;

    if (!firebaseId) {
      res.status(401).json({ error: "Unauthorized: No user info" });
      return;
    }

    // Get account_id of the current user (the recipient)
    const userResult = await sql`
      SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}
    `;

    if (userResult.length === 0) {
      res.status(404).json({ error: "User account not found" });
      return;
    }

    const { account_id } = userResult[0];

    // Verify the payment request exists and belongs to the user as recipient
    const requestResult = await sql`
      SELECT * FROM payment_requests
      WHERE id = ${id} AND account_id_to = ${account_id} AND status = 'pending'
    `;

    if (requestResult.length === 0) {
      res.status(404).json({ error: "No pending payment request found for this user." });
      return;
    }

    const paymentRequest = requestResult[0];

    // Get the requester's username for the transfer
    const requesterResult = await sql`
      SELECT username FROM accounts WHERE account_id = ${paymentRequest.account_id_from}
    `;

    if (requesterResult.length === 0) {
      res.status(404).json({ error: "Requester account not found" });
      return;
    }

    const requesterUsername = requesterResult[0].username;

    // Get the currency code for this payment request
    const currencyResult = await sql`
      SELECT code FROM currencies WHERE currency_id = ${paymentRequest.currency_id}
    `;

    if (currencyResult.length === 0) {
      res.status(400).json({ error: "Invalid currency in payment request" });
      return;
    }

    const currencyCode = currencyResult[0].code;

    // Check if the recipient has a wallet in the specified currency
    const recipientWalletCheck = await sql`
      SELECT w.balance, w.wallet_id, c.code 
      FROM wallets w 
      JOIN currencies c ON w.currency_id = c.currency_id 
      WHERE w.account_id = ${account_id} AND c.code = ${currencyCode}
    `;

    if (recipientWalletCheck.length === 0) {
      res.status(400).json({ 
        error: `You don't have a ${currencyCode} wallet. Please create one first.` 
      });
      return;
    }

    // Convert to numbers to ensure proper comparison
    const recipientBalance = parseFloat(recipientWalletCheck[0].balance);
    const requestedAmount = parseFloat(paymentRequest.amount);

    if (recipientBalance < requestedAmount) {
      res.status(400).json({ 
        error: `Insufficient balance in your ${currencyCode} wallet. You have ${recipientBalance} ${currencyCode} but need ${requestedAmount} ${currencyCode}.` 
      });
      return;
    }

    // Also check if the requester has a wallet in the specified currency
    const requesterWalletCheck = await sql`
      SELECT w.balance, w.wallet_id, c.code 
      FROM wallets w 
      JOIN currencies c ON w.currency_id = c.currency_id 
      WHERE w.account_id = ${paymentRequest.account_id_from} AND c.code = ${currencyCode}
    `;

    if (requesterWalletCheck.length === 0) {
      res.status(400).json({ 
        error: `The requester (${requesterUsername}) doesn't have a ${currencyCode} wallet. They need to create one first.` 
      });
      return;
    }

    // Create a mock request object for the send money function
    const transferReq = {
      user: { uid: firebaseId },
      body: {
        recipientUsername: requesterUsername,
        currencyCode: currencyCode,
        amount: paymentRequest.amount,
        description: `Payment request settlement: ${paymentRequest.description || 'No description'}`
      }
    } as any;

    // Create a mock response object to capture the result
    const transferRes = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 200) {
            // Transfer successful, update payment request status
            sql`
              UPDATE payment_requests
              SET status = 'approved'
              WHERE id = ${id}
            `;
            res.status(200).json({ 
              message: "Payment request settled successfully.",
              transferDetails: data
            });
          } else {
            // Transfer failed
            res.status(code).json({ 
              error: "Failed to settle payment request",
              details: data
            });
          }
        }
      })
    } as any;

    // Execute the transfer using our send money function
    await postSendMoney(transferReq, transferRes);

  } catch (error) {
    console.error("Error settling payment request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}