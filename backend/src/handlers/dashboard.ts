import { Request, Response } from "express";
import sql from "../database/client";

import { ParsedQs } from "qs";

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

interface IconCategory {
  category: string;
  icon: string;
  parent?: string;
}

const walletPalette = [
  "from-emerald-400 to-emerald-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
];

// returns user wallet given valid auth_id
export async function getUserWallet(req: Request, res: Response) {
  const auth_id = (req as any).user.uid;

  if (!auth_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  // get data from db excluding colour
  try {
    const wallets: Wallet[] = await sql`
      SELECT ROW_NUMBER() OVER (ORDER BY w.wallet_id) AS id,
      w.wallet_id AS wallet_id,
      c.code AS currency, 
      CAST(w.balance AS FLOAT) as balance,
      c.symbol as symbol
      FROM wallets w 
      JOIN accounts a ON w.account_id = a.account_id 
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE a.firebase_id = ${auth_id}
    `;

    // maps each wallet to a colour, ensure adjacent wallet do not have the same colour
    const walletsColour: WalletGradient[] = wallets.map((w, c) => ({
      ...w,
      gradient: walletPalette[c % walletPalette.length],
    }));

    res.json({
      wallets: walletsColour,
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

  const {
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sort,
    searchTerm,
  } = req.query;

  try {
    const baseConditions = [
      sql`(sender_account.firebase_id = ${auth_id} OR recipient_account.firebase_id = ${auth_id})`,
    ];

    if (minAmount !== undefined) {
      baseConditions.push(sql`transactions.amount >= ${Number(minAmount)}`);
    }

    if (maxAmount !== undefined) {
      baseConditions.push(sql`transactions.amount <= ${Number(maxAmount)}`);
    }

    function parseQueryParam(
      value: string | ParsedQs | (string | ParsedQs)[] | undefined
    ): string | undefined {
      if (typeof value === "string") {
        return value;
      } else if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      return undefined;
    }

    const rawStartDate = parseQueryParam(startDate);

    if (rawStartDate) {
      const start = new Date(rawStartDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        baseConditions.push(
          sql`transactions.event_time >= ${start.toISOString()}`
        );
      }
    }

    const rawEndDate = parseQueryParam(endDate);

    if (rawEndDate) {
      const end = new Date(rawEndDate);
      if (!isNaN(end.getTime())) {
        baseConditions.push(
          sql`transactions.event_time <= ${end.toISOString()}`
        );
      }
    }

    if (searchTerm) {
      const term = `${searchTerm}%`;
      baseConditions.push(sql`transactions.name ILIKE ${term}`);
    }

    if (category) {
      const catTerm = `${category}`;
      baseConditions.push(sql`${catTerm} = ANY(transactions.category)`);
    }

    let orderBy = sql`time DESC`;

    if (sort === "date-asc") {
      orderBy = sql`time ASC`;
    } else if (sort === "amount-desc") {
      orderBy = sql`transactions.amount DESC`;
    } else if (sort === "amount-asc") {
      orderBy = sql`transactions.amount ASC`;
    } else if (sort === "name-asc") {
      orderBy = sql`name ASC`;
    } else if (sort === "name-desc") {
      orderBy = sql`name DESC`;
    }

    function sqlJoin(sqlArray: any[], separator: any) {
      if (sqlArray.length === 0) return null;
      return sqlArray.reduce((acc, curr, i) =>
        i === 0 ? curr : sql`${acc}${separator}${curr}`
      );
    }

    const whereClause =
      baseConditions.length > 0
        ? sql`WHERE ${sqlJoin(baseConditions, sql` AND `)}`
        : sql``;

    const transactions: Transaction[] = await sql`
        SELECT ROW_NUMBER() OVER (ORDER BY transactions.transaction_id) AS id,
        transactions.transaction_id AS transaction_id,
        transactions.name,
        CASE 
          WHEN sender_account.firebase_id = ${auth_id} AND recipient_account.firebase_id != ${auth_id} THEN -transactions.amount
          ELSE transactions.amount
        END AS amount, 
        currency.symbol as symbol,
        transactions.event_time as time, 
        transactions.category,
          (
        SELECT c.icon
        FROM categories c
        WHERE c.category = ANY(transactions.category)
        ORDER BY array_position(transactions.category, c.category)
        LIMIT 1
      ) AS direct_icon,

      (
        SELECT p.icon
        FROM categories c
        JOIN categories p ON c.parent = p.category_id
        WHERE c.category = ANY(transactions.category)
        ORDER BY array_position(transactions.category, c.category)
        LIMIT 1
      ) AS fallback_icon,

          COALESCE(
            (
              SELECT COALESCE(c.icon, p.icon)
              FROM categories c
              LEFT JOIN categories p ON c.parent = p.category_id
              WHERE c.category = ANY(transactions.category)
              ORDER BY array_position(transactions.category, c.category)
              LIMIT 1
            ),
            '❓'
          ) AS icon

        FROM transactions transactions
        JOIN currencies currency ON transactions.currency = currency.currency_id
        JOIN wallets sender_wallet ON transactions.sender_wallet_id = sender_wallet.wallet_id
        JOIN accounts sender_account on sender_wallet.account_id = sender_account.account_id
        LEFT JOIN wallets recipient_wallet ON transactions.recipient_wallet_id = recipient_wallet.wallet_id
        LEFT JOIN accounts recipient_account on recipient_wallet.account_id = recipient_account.account_id
        ${whereClause}
        ORDER BY ${orderBy}, transactions.transaction_id DESC
      `;

    res.json({
      transactions: transactions,
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
