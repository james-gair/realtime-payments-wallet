import { Request, Response } from "express";
import sql from "../database/client";

interface category {
  id: number;
  text: string;
}

export async function getUserCategories(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;

    try {        
      const categories : category[] = await sql`
        SELECT DISTINCT UNNEST(transactions.category) AS category
        FROM transactions transactions
        JOIN wallets sender_wallet ON transactions.sender = sender_wallet.wallet_id
        JOIN accounts sender_account on sender_wallet.account_id = sender_account.account_id
        JOIN wallets recipient_wallet ON transactions.recipient = recipient_wallet.wallet_id
        JOIN accounts recipient_account on recipient_wallet.account_id = recipient_account.account_id
        WHERE sender_account.firebase_id = ${auth_id}
				OR recipient_account.firebase_id = ${auth_id}
        ORDER BY category;
      `;

			console.log(categories)
      res.json({categories});

      return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
    
}
