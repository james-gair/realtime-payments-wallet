import { Request, Response } from "express";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";

export async function addMoney(req: Request, res: Response) {
  try {
    const { amount, currency, walletId, paymentMethod } = req.body;

    if (!amount || !currency || !walletId || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const firebase_id = (req as any).user?.uid;
    const accountId = await getAccountId(firebase_id);

    const walletDetails = await sql`
      SELECT balance FROM wallets WHERE wallet_id = ${walletId} and account_id = ${accountId}
    `;

    if (walletDetails.length === 0) {
      return res.status(404).json({ error: "Wallet not found." });
    }
    const balance = walletDetails[0].balance;

    const newBalance = parseFloat(balance) + parseFloat(amount);

    await sql`
      UPDATE wallets SET balance = ${newBalance} WHERE wallet_id = ${walletId} and account_id = ${accountId}
    `;

    // Add transaction
    await sql`
      INSERT INTO transactions (name, amount, sender_wallet_id, recipient_wallet_id, category, currency)
      VALUES ('Added money', ${amount}, ${walletId}, ${walletId}, ARRAY['finance'], 1)
    `;

    res.status(200).json({ message: "Money added successfully." });
  } catch (error: any) {
    console.error("Failed to add money:", error);
    res.status(500).json({ error: "An error occurred while adding money." });
  }
}
