import { Request, Response } from "express";
import sql from "../database/client";

import { ParsedQs } from 'qs';

import { fetchSpecificExchangeRate } from "./fxRates";

interface Wallet {
  id: number;
  currency: string;
  balance: number;
  symbol: string;
}

interface WalletGradient extends Wallet {
  gradient: string;
}

interface Transaction {
  id: number;
  name: string;
  amount: string;
  time: string;
  category?: string[];
}

interface TransactionIcon extends Transaction {
  color?: string;
  icon: string;
}
// add colours for wallet here
const walletPalette = [
  "from-emerald-400 to-emerald-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
];

interface IconCategory {
  category: string;
  icon: string;
  parent?: string;
}

const iconCategories: IconCategory[] = [
  { category: "food", icon: "🍽️" },
  { category: "groceries", icon: "🛒", parent: "food" },
  { category: "restaurant", icon: "🍝", parent: "food" },
  { category: "fast food", icon: "🍟", parent: "food" },
  { category: "drink", icon: "🥤"},
  { category: "cafe", icon: "☕", parent: "drink" },
  { category: "alcohol", icon: "🍷", parent: "drink" },

  { category: "housing", icon: "🏠" },
  { category: "rent", icon: "💸", parent: "housing" },
  { category: "mortgage", icon: "🏡", parent: "housing" },
  { category: "utilities", icon: "💡", parent: "housing" },
  { category: "internet", icon: "🌐", parent: "utilities" },
  { category: "electricity", icon: "🔌", parent: "utilities" },
  { category: "water", icon: "🚿", parent: "utilities" },

  { category: "finance", icon: "💳" },
  { category: "loan", icon: "🏦", parent: "finance" },
  { category: "investment", icon: "📈", parent: "finance" },
  { category: "income", icon: "💵", parent: "finance" },
  { category: "savings", icon: "💰", parent: "finance" },
  { category: "insurance", icon: "🛡️", parent: "finance" },

  { category: "shopping", icon: "🛍️" },
  { category: "clothing", icon: "👗", parent: "shopping" },
  { category: "electronics", icon: "📱", parent: "shopping" },
  { category: "furniture", icon: "🛋️", parent: "shopping" },
  { category: "online shopping", icon: "💻", parent: "shopping" },

  { category: "health", icon: "🏥" },
  { category: "pharmacy", icon: "💊", parent: "health" },
  { category: "doctor", icon: "🩺", parent: "health" },
  { category: "gym", icon: "🏋️", parent: "health" },

  { category: "entertainment", icon: "🎉" },
  { category: "movies", icon: "🎬", parent: "entertainment" },
  { category: "music", icon: "🎧", parent: "entertainment" },
  { category: "games", icon: "🎮", parent: "entertainment" },
  { category: "subscription", icon: "🔔", parent: "entertainment" },

  { category: "travel", icon: "✈️" },
  { category: "accommodation", icon: "🏨", parent: "travel" },
  { category: "flights", icon: "🛫", parent: "travel" },
  { category: "taxis", icon: "🚖", parent: "travel" },
  { category: "sightseeing", icon: "🗺️", parent: "travel" }
];

// const transaction_palette = ["bg-orange-100", "bg-red-100", "bg-green-100"];

export async function getUserWallet(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;

  // get data from db excluding colour
  try {
    const wallets: Wallet[] = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY w.wallet_id) AS id,
        c.code AS currency, CAST(w.balance AS FLOAT), c.symbol
        FROM wallets w 
        JOIN accounts a ON w.account_id = a.account_id 
        JOIN currencies c ON w.currency_id = c.currency_id
        WHERE a.firebase_id = ${auth_id}
      `;

    // maps each wallet to a colour, ensure adjacent wallet do not have the same colour
    const wallets_colour: WalletGradient[] = wallets.map((w, c) => ({
      ...w,
      gradient: walletPalette[c % walletPalette.length],
    }));

    res.json({
      wallets: wallets_colour,
    });

    return;
  } catch (error) {
    console.error("Error retrieving wallet data", error);
    res.status(500).send({ error: "Failed to retrieve wallets" });
    return;
  }
}

export async function getUserTransactions(req: Request, res: Response) {
    const auth_id = (req as any).user.uid;

    const { category, minAmount, maxAmount, 
            startDate, endDate, sort, searchTerm} = req.query;

    
    try {
      const baseConditions = [
        sql`(sender_account.firebase_id = ${auth_id} OR recipient_account.firebase_id = ${auth_id})`
      ];

      if (minAmount !== undefined) {
        console.log("push");
        baseConditions.push(sql`transactions.amount >= ${Number(minAmount)}`);
      }

      if (maxAmount !== undefined) {
        console.log("push");
        baseConditions.push(sql`transactions.amount <= ${Number(maxAmount)}`);
      }

      function parseQueryParam(value: string | ParsedQs | (string | ParsedQs)[] | undefined): string | undefined {
        if (typeof value === 'string') return value;
        if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
        return undefined;
      }

      const rawStartDate = parseQueryParam(startDate);

      if (rawStartDate) {
        const start = new Date(rawStartDate);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          baseConditions.push(sql`transactions.event_time >= ${start.toISOString()}`);
        }
      }

      const rawEndDate = parseQueryParam(endDate);

      if (rawEndDate) {
        const end = new Date(rawEndDate);
        if (!isNaN(end.getTime())) {
          baseConditions.push(sql`transactions.event_time <= ${end.toISOString()}`);
        }
      }

      if (searchTerm) {
        const term = `${searchTerm}%`;
        baseConditions.push(sql`transactions.name ILIKE ${term}`);
      }

      if(category) {
        console.log(category)
        const catTerm = `${category}`;
        baseConditions.push(sql`${catTerm} = ANY(transactions.category)`);
      }

      console.log("Sort param:", sort);
      let orderBy = sql`time DESC`;
      if (sort === 'date-asc') {
        orderBy = sql`time ASC`;
      } else if (sort === 'amount-desc') {
        orderBy = sql`transactions.amount DESC`;
      } else if (sort === 'amount-asc') {
        orderBy = sql`transactions.amount ASC`;
      } else if (sort === 'name-asc') {
        orderBy = sql`name ASC`;
      } else if (sort === 'name-desc') {
        orderBy = sql`name DESC`;
      }

      function sqlJoin(sqlArray: any[], separator: any) {
        if (sqlArray.length === 0) return null;
        return sqlArray.reduce((acc, curr, i) =>
          i === 0 ? curr : sql`${acc}${separator}${curr}`
        );
      }

      const whereClause = baseConditions.length > 0
        ? sql`WHERE ${sqlJoin(baseConditions, sql` AND `)}`
        : sql``;

      const transactions : Transaction[] = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) AS id,
        transactions.name,
        CASE 
          WHEN sender_account.firebase_id = ${auth_id} THEN -transactions.amount
          ELSE transactions.amount
        END AS amount, 
        currency.symbol,
        transactions.event_time as time, 
        transactions.category
        FROM transactions transactions
        JOIN currencies currency ON transactions.currency = currency.currency_id
        JOIN wallets sender_wallet ON transactions.sender = sender_wallet.wallet_id
        JOIN accounts sender_account on sender_wallet.account_id = sender_account.account_id
        JOIN wallets recipient_wallet ON transactions.recipient = recipient_wallet.wallet_id
        JOIN accounts recipient_account on recipient_wallet.account_id = recipient_account.account_id
        ${whereClause}
        ORDER BY ${orderBy}, transactions.transaction_id DESC
      `;

      const categoryToIcon = new Map<string, string>();
      const categoryToParent = new Map<string, string | undefined>();

      for (const { category, icon, parent } of iconCategories) {
        categoryToIcon.set(category, icon);
        categoryToParent.set(category, parent);
      }

      function resolveIconFromCategories(categories: string[]): string {
        // Sort longest paths first (most specific)
        const sorted = [...categories].sort((a, b) => {
          let depthA = getCategoryDepth(a);
          let depthB = getCategoryDepth(b);
          return depthB - depthA; // more specific first
        });

        for (const cat of sorted) {
          let resolved = resolveCategoryToIcon(cat);
          if (resolved) return resolved;
        }

        return "❓"; // Fallback
      }

      function resolveCategoryToIcon(category: string): string | undefined {
        // Traverse up the hierarchy to find icon
        let current = category;
        while (current) {
          const icon = categoryToIcon.get(current);
          if (icon) return icon;
          current = categoryToParent.get(current) ?? "";
        }
        return undefined;
      }

      function getCategoryDepth(category: string): number {
        let depth = 0;
        let current = category;
        while (categoryToParent.has(current)) {
          current = categoryToParent.get(current)!;
          depth++;
        }
        return depth;
      }

      const transactions_time: TransactionIcon[] = transactions.map((tx, c) => {
        const icon = Array.isArray(tx.category)
          ? resolveIconFromCategories(tx.category)
          : "❓";

        return {
          ...tx,
          // color: transaction_palette[c % transaction_palette.length],
          icon
        };
      });

    res.json({
      transactions: transactions_time,
    });
    console.log(transactions_time);

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
      INSERT INTO wallets (account_id, currency_id, balance, monthly_limit)
      VALUES (
        (SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}),
        (SELECT currency_id FROM currencies WHERE code = ${currencyCode}),
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
  const exchangeRate = await fetchSpecificExchangeRate(
    fromCurrencyCode,
    toCurrencyCode
  );

  if (fromAmount <= 0) {
    res.status(400).json({ error: "negative amount err" });
    return;
  }

  try {
    // runs quaries as a single transaction ???
    await sql.begin(async (sql) => {
      const [account] = await sql`
        SELECT account_id FROM accounts WHERE firebase_id = ${firebaseId}
      `;
      if (!account) throw new Error("acc not found");

      const [fromCurrency] = await sql`
        SELECT currency_id FROM currencies WHERE code = ${fromCurrencyCode}
      `;
      const [toCurrency] = await sql`
        SELECT currency_id FROM currencies WHERE code = ${toCurrencyCode}
      `;
      if (!fromCurrency || !toCurrency) {
        throw new Error("currency not found/not supported");
      }

      // Lock wallet rows for update
      const [fromWallet] = await sql`
        SELECT * FROM wallets
                  WHERE account_id = ${account.account_id} AND currency_id = ${fromCurrency.currency_id}
        FOR UPDATE
      `;
      const [toWallet] = await sql`
        SELECT * FROM wallets
                  WHERE account_id = ${account.account_id} AND currency_id = ${toCurrency.currency_id}
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
        UPDATE wallets
        SET balance = balance - ${fromAmount}
        WHERE wallet_id = ${fromWallet.wallet_id}
      `;

      await sql`
        UPDATE wallets
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
        SELECT account_id FROM accounts WHERE firebase_id = ${senderFirebaseId}
      `;
      if (!senderAccount) throw new Error("ERR");

      const [recipientAccount] = await sql`
        SELECT account_id FROM accounts WHERE username = ${recipientUsername}
      `;
      if (!recipientAccount)
        throw new Error("no such user to transfer money to");

      const [currency] = await sql`
        SELECT currency_id FROM currencies WHERE code = ${currencyCode}
      `;
      if (!currency) throw new Error("currency invalid or not supported");

      const [senderWallet] = await sql`
        SELECT * FROM wallets
                  WHERE account_id = ${senderAccount.account_id} AND currency_id = ${currency.currency_id}
        FOR UPDATE
      `;

      if (!senderWallet) {
        throw new Error(`you don't have a ${currencyCode} wallet`);
      }

      const [recipientWallet] = await sql`
        SELECT * FROM wallets
                  WHERE account_id = ${recipientAccount.account_id} AND currency_id = ${currency.currency_id}
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
        UPDATE wallets
        SET balance = balance - ${amount}
        WHERE wallet_id = ${senderWallet.wallet_id}
      `;

      await sql`
        UPDATE wallets
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
