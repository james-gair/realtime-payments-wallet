import { Request, Response } from "express";
import sql from "../database/client";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime); 

export async function getUserWallet(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;
    
    try {
      // need to add a method to asign colours
      const wallets = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY w.wallet_id) AS id,
        c.code AS currency, w.balance, w.card_number AS cardNumber, w.expiry_date AS expiryDate, c.symbol,
        CASE (ROW_NUMBER() OVER (ORDER BY w.wallet_id) % 5)
          WHEN 1 THEN 'from-purple-400 to-purple-600'
          WHEN 2 THEN 'from-blue-400 to-blue-600'
          WHEN 3 THEN 'from-emerald-400 to-emerald-600'
        END AS gradient
        FROM Wallet w 
        JOIN Account a ON w.account = a.account_id 
        JOIN Currency c ON w.currency = c.currency_id
        WHERE a.firebase_id = ${auth_id}
      `;

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

export async function getUserTransactions(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;
    
    try {
      // need to add a method to asign colours
      const transactions = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) AS id,
        transactions.name,
        CASE 
          WHEN sender_account.firebase_id = ${auth_id} THEN -transactions.amount
          ELSE transactions.amount
        END AS amount, 
        transactions.event_time as time, transactions.category,
        CASE (ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) % 5)
          WHEN 1 THEN 'from-purple-400 to-purple-600'
          WHEN 2 THEN 'from-blue-400 to-blue-600'
          WHEN 3 THEN 'from-emerald-400 to-emerald-600'
          WHEN 4 THEN 'from-emerald-400 to-emerald-600'
          ELSE 'from-emerald-400 to-emerald-600'
        END AS color,
        CASE (ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) % 5)
          WHEN 1 THEN '🎨'
          WHEN 2 THEN '1🎨1'
          WHEN 3 THEN '11🎨'
          WHEN 4 THEN '11🎨'
          ELSE '11🎨'
        END AS icon
        FROM Transactions transactions
        JOIN Wallet sender_wallet ON transactions.sender = sender_wallet.wallet_id
        JOIN Account sender_account on sender_wallet.account = sender_account.account_id
        JOIN Wallet recipient_wallet ON transactions.recipient = recipient_wallet.wallet_id
        JOIN Account recipient_account on recipient_wallet.account = recipient_account.account_id
        WHERE sender_account.firebase_id = ${auth_id}
        OR recipient_account.firebase_id = ${auth_id}
      `;

      // uses dayjs package to get time since this transaction
      const relative_time = transactions.map(tx => ({
        ...tx,
        time: dayjs(tx.time).fromNow(),
      }));

      res.json({
        transactions: relative_time
      });

      return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
}