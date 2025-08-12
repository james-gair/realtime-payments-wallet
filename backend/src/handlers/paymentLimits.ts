import { Request, Response } from "express";
import sql from "../database/client";
import { LimitsSchema } from "../schemas/paymentLimits.schema";
import { PaymentLimit } from "../types/paymentLimits";

// This function gives all the payment limits settings for each wallet the user has.
export async function getPaymentLimits(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }
  try {
    const limits = await sql<PaymentLimit[]>`
      SELECT 
        w.wallet_id AS "walletId",
        w.monthly_limit AS "limit",
        c.code AS currency
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      JOIN accounts a ON w.account_id = a.account_id
      WHERE a.firebase_id = ${firebase_id}
    `;
    res.status(200).json({ limits });
  } catch (error) {
    console.error("Error fetching payment limits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// This function saves the payment limits the user gives.
export async function postPaymentLimits(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }
  // input validation
  const parseResult = LimitsSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid input",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { limits } = parseResult.data;

  try {
    for (const { walletId, limit } of limits) {
      const result = await sql`
        UPDATE wallets w
        SET monthly_limit = ${limit}
        FROM accounts a
        WHERE w.wallet_id = ${walletId}
          AND w.account_id = a.account_id
          AND a.firebase_id = ${firebase_id}
        RETURNING w.wallet_id
      `;

      if (result.length === 0) {
        res.status(403).json({
          error: `Wallet ID ${walletId} does not belong to the authenticated user or does not exist.`,
        });
        return;
      }
    }

    res.status(200).json({ success: true, updated: limits.length });
  } catch (error) {
    console.error("Error updating payment limits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
