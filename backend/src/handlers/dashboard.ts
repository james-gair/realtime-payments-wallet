import { Request, Response } from "express";
import sql from "../database/client";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime); 

interface wallet {
  id: number;
  currency: string;
  balance: number;
  symbol: string;
}

interface wallet_gradient extends wallet {
  gradient: string;
}

interface transaction {
  id: number;
  name: string;
  amount: string;
  time: string;
  category?: string;
}

interface transaction_icon extends transaction {
  color: string;
  icon: string;
}


// add colours for wallet here
const wallet_palette = [
  "from-emerald-400 to-emerald-600", "from-blue-400 to-blue-600", "from-purple-400 to-purple-600"
];

const transaction_palette = [
  "bg-orange-100", "bg-red-100", "bg-green-100"
];

export async function getUserWallet(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;
    
    // get data from db excluding colour 
    try {
      const wallets: wallet[] = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY w.wallet_id) AS id,
        c.code AS currency, w.balance, c.symbol
        FROM Wallet w 
        JOIN Account a ON w.account = a.account_id 
        JOIN Currency c ON w.currency = c.currency_id
        WHERE a.firebase_id = ${auth_id}
      `;

      // maps each wallet to a colour, ensure adjacent wallet do not have the same colour
      const wallets_colour: wallet_gradient[] = wallets.map((w, c) => ({
        ...w,
        gradient: wallet_palette[c % wallet_palette.length]
      }));

      res.json({
        wallets: wallets_colour
      });

      return;
  } catch (error) {
    console.error("Error retrieving wallet data", error);
    res.status(500).send({ error: "Failed to retrieve wallets" });
    return;
  }
}

import * as emoji from "node-emoji";

export async function getUserTransactions(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;
    
    try {
      // need to add a method to asign colours
      const transactions : transaction[] = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) AS id,
        transactions.name,
        CASE 
          WHEN sender_account.firebase_id = ${auth_id} THEN -transactions.amount
          ELSE transactions.amount
        END AS amount, 
        transactions.event_time as time, transactions.category
        FROM Transactions transactions
        JOIN Wallet sender_wallet ON transactions.sender = sender_wallet.wallet_id
        JOIN Account sender_account on sender_wallet.account = sender_account.account_id
        JOIN Wallet recipient_wallet ON transactions.recipient = recipient_wallet.wallet_id
        JOIN Account recipient_account on recipient_wallet.account = recipient_account.account_id
        WHERE sender_account.firebase_id = ${auth_id}
        OR recipient_account.firebase_id = ${auth_id}
      `;

      // uses dayjs package to get time since this transaction
      const transactions_time: transaction_icon[] = transactions.map((tx, c) => ({
        ...tx,
        time: dayjs(tx.time).fromNow(),
        color: transaction_palette[c % transaction_palette.length],
        icon: "❓"
      }));

      res.json({
        transactions: transactions_time
      });

      return;
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ error: "Failed to add user" });
    return;
  }
}

export async function postCreateWallet(req: Request, res: Response) {
  //console.log("postCreateWallet called");
  const firebaseId = (req as any).user.uid;
  const { currencyCode } = req.body;

  try {
    await sql`
      INSERT INTO Wallet (account, currency, balance, monthly_limit)
      VALUES (
        (SELECT account_id FROM Account WHERE firebase_id = ${firebaseId}),
        (SELECT currency_id FROM Currency WHERE code = ${currencyCode}),
        0,
        10000
      )
    `;

    res.status(201).json({ message: "wallet created" });
    return;
  } catch (err) {
    console.error("err wallet creation", err);
    res.status(500).json({ error: "fail create wallet" });
    return;
  }
}