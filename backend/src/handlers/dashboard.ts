import { Request, Response } from "express";
import sql from "../database/client";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchSpecificExchangeRate } from "./fxRates";
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

export async function postExchangeCurrency(req: Request, res: Response) {
  const firebaseId = (req as any).user.uid;

  // Fixed for now; will be pulled from forex API in later development
  const { fromCurrencyCode, toCurrencyCode, fromAmount } = req.body;
  const exchangeRate = await fetchSpecificExchangeRate(fromCurrencyCode, toCurrencyCode);

  if (fromAmount <= 0) {
    res.status(400).json({ error: "negative amount err" });
    return;
  }

  try {
    // runs quaries as a single transaction ???
    await sql.begin(async (sql) => {
      const [account] = await sql`
        SELECT account_id FROM Account WHERE firebase_id = ${firebaseId}
      `;
      if (!account) throw new Error("acc not found");

      const [fromCurrency] = await sql`
        SELECT currency_id FROM Currency WHERE code = ${fromCurrencyCode}
      `;
      const [toCurrency] = await sql`
        SELECT currency_id FROM Currency WHERE code = ${toCurrencyCode}
      `;
      if (!fromCurrency || !toCurrency) {
        throw new Error("currency not found/not supported");
      }

      // Lock wallet rows for update
      const [fromWallet] = await sql`
        SELECT * FROM Wallet
        WHERE account = ${account.account_id} AND currency = ${fromCurrency.currency_id}
        FOR UPDATE
      `;
      const [toWallet] = await sql`
        SELECT * FROM Wallet
        WHERE account = ${account.account_id} AND currency = ${toCurrency.currency_id}
        FOR UPDATE
      `;
      if (!fromWallet || !toWallet) {
        throw new Error("wallets for both currency types must exist");
      }

      if (fromWallet.balance < fromAmount) {
        throw new Error("balance insufficient");
      }

      const toAmount = parseFloat((fromAmount * exchangeRate).toFixed(2));

      // update wallet balances
      await sql`
        UPDATE Wallet
        SET balance = balance - ${fromAmount}
        WHERE wallet_id = ${fromWallet.wallet_id}
      `;

      await sql`
        UPDATE Wallet
        SET balance = balance + ${toAmount}
        WHERE wallet_id = ${toWallet.wallet_id}
      `;
    });

    res.status(200).json({ message: "exchanged successfully" });

  } catch (err: any) {
    console.error("exchange err:", err);
    res.status(500).json({ error: err.message || "exchange failed" });
  }
}


export async function postTransferCurrency(req: Request, res: Response) {
  const senderFirebaseId = (req as any).user.uid;
  const { recipientUsername, currencyCode, amount } = req.body;

  if (amount <= 0) {
    res.status(400).json({ error: "enter postive transfer amount" });
    return;
  }

  try {
    await sql.begin(async (sql) => {
      const [senderAccount] = await sql`
        SELECT account_id FROM Account WHERE firebase_id = ${senderFirebaseId}
      `;
      if (!senderAccount) throw new Error("ERR");

      const [recipientAccount] = await sql`
        SELECT account_id FROM Account WHERE username = ${recipientUsername}
      `;
      if (!recipientAccount) throw new Error("no such user to transfer money to");

      const [currency] = await sql`
        SELECT currency_id FROM Currency WHERE code = ${currencyCode}
      `;
      if (!currency) throw new Error("currency invalid or not supported");

      const [senderWallet] = await sql`
        SELECT * FROM Wallet
        WHERE account = ${senderAccount.account_id} AND currency = ${currency.currency_id}
        FOR UPDATE
      `;

      if (!senderWallet) {
        throw new Error(`you don't have a ${currencyCode} wallet`);
      }

      const [recipientWallet] = await sql`
        SELECT * FROM Wallet
        WHERE account = ${recipientAccount.account_id} AND currency = ${currency.currency_id}
        FOR UPDATE
      `;
      if (!recipientWallet) {
        throw new Error(`target user has no wallet of ${currencyCode}`);
      }

      if (senderWallet.balance < amount) {
        throw new Error("insufficient balance");
      }

      // balance update
      await sql`
        UPDATE Wallet
        SET balance = balance - ${amount}
        WHERE wallet_id = ${senderWallet.wallet_id}
      `;

      await sql`
        UPDATE Wallet
        SET balance = balance + ${amount}
        WHERE wallet_id = ${recipientWallet.wallet_id}
      `;

      // TODO
      // !!!! THIS NEEDS TO BE INSERTED INTO TRANSACTION RECORD AS WELL
    });

    res.status(200).json({ message: "transfer successful" });

  } catch (err: any) {
    console.error("transfer err:", err);
    res.status(500).json({ error: err.message || "transfer failed" });
  }
}
