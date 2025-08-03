import sql from "../database/client";
import {
  sendEmailByEmail,
  sendEmailToUserByAccountId,
} from "../utils/notifyUserByEmail";

/**
 * Checks whether the user has exceeded the monthly spending limit
 * for the specified wallet. If the limit has been exceeded, this
 * function sends an email notification to the user.
 *
 * You can choose to await this function if you want to ensure the
 * check completes before continuing, or run it in the background
 * (e.g. without await) if you don’t want to delay the response.
 */

export async function checkPaymentLimitForWalletId(walletId: string) {
  const result = await sql<
    {
      accountId: number;
      monthlyLimit: number | null;
      totalSpent: number;
      currencyCode: string;
    }[]
  >`
    SELECT 
      w.account_id AS "accountId",
      w.monthly_limit AS "monthlyLimit",
      COALESCE(SUM(t.amount), 0) AS "totalSpent",
      c.code AS "currencyCode"
    FROM wallets w
    JOIN currencies c ON w.currency_id = c.currency_id
    LEFT JOIN transactions t 
      ON t.sender_wallet_id = w.wallet_id
      AND date_trunc('month', t.event_time) = date_trunc('month', CURRENT_DATE)
    WHERE w.wallet_id = ${walletId}
    GROUP BY w.account_id, w.monthly_limit, c.code
  `;

  if (result.length === 0) {
    throw new Error(`Wallet ${walletId} not found`);
  }

  const { accountId, monthlyLimit, totalSpent, currencyCode } = result[0];

  if (monthlyLimit === null) {
    return;
  }

  const exceeded = totalSpent > monthlyLimit;

  if (exceeded) {
    sendEmailToUserByAccountId(accountId, "Monthly spending limit exceeded", {
      text: `Your ${currencyCode} wallet has exceeded the monthly spending limit of ${monthlyLimit} ${currencyCode}. Total spent so far this month: ${totalSpent} ${currencyCode}.`,
    });
  }
}
