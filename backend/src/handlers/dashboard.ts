import { Request, Response } from "express";
import sql from "../database/client";

export async function getUser(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;
    
    try {
      const wallets = await sql`
        SELECT c.code, w.balance 
        FROM Wallet w 
        JOIN Account a ON w.account = a.account_id 
        JOIN Currency c ON w.currency = c.currency_id
        WHERE a.firebase_id = ${auth_id}
      `;

      // just for debugging
      console.log(wallets)
      res.json({
        wallets
      });
      return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
}