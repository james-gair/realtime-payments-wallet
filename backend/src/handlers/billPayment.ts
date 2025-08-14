import { Request, Response } from "express";
import sql from "../database/client";
import { CancelBillParams } from "../dtos/BillPaymentReq";
import { billPaymentSchema } from "../schemas/billPayment.schema";
import { getAccountId } from "../utils/getAccountId";
import { checkPaymentLimitForWalletId } from "../services/checkPaymentLimits";
import { Bill, SavedBillRes, UpcomingBillRes } from "../types/billPayments";
import { payBillAction } from "../utils/billPaymentsLogic/service";

// This function receive the request of creating a bill,
// creates a row in the db bill_payments table,
// pays the bill immediately if it is not scheduled.
export async function payBill(req: Request, res: Response) {
  // get user id
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  // input validation
  const parseResult = billPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error(parseResult);
    res.status(400).json({
      error: "Invalid request body",
      issues: parseResult.error.issues,
    });
    return;
  }

  const data = parseResult.data;

  try {
    // Get the account_id:
    const accountId = await getAccountId(firebase_id);
    // If the user wants to pay it immediately, we
    // check if there's enough fund first
    if (isDateToday(data.firstPaymentDate)) {
      const balance = await sql`
        SELECT balance
        FROM wallets
        WHERE wallet_id = ${data.walletId}
      `;

      if (Number(balance[0].balance) < Number(data.amount)) {
        res.status(400).send({
          error: "Insufficient funds. Failed to create this bill payment.",
        });
        return;
      }
    }
    // insert value to db
    const result = await sql`
    INSERT INTO bill_payments (
      account_id,
      wallet_id,
      amount,
      pay_method,
      biller_bsb,
      biller_bank_account_number,
      biller_bpay_code,
      biller_bpay_ref,
      biller_display_name,
      bill_display_name,
      type,
      first_payment_date,
      next_run_at,
      frequency,
      reminder,
      remind_before_num_days,
      status
    ) VALUES (
      ${accountId},
      ${data.walletId},
      ${data.amount},
      ${data.payMethod},
      ${data.billerBsb ?? null},
      ${data.billerBankAccountNumber ?? null},
      ${data.billerBpayCode ?? null},
      ${data.billerBpayRef ?? null},
      ${data.billerDisplayName ?? null},
      ${data.billDisplayName ?? null},
      ${data.type},
      ${data.firstPaymentDate},
      ${data.firstPaymentDate},
      ${data.frequency ?? null},
      ${data.reminder ?? false},
      ${data.reminderDays ?? null},
      -- set the processing status if the first payment date is today
      -- so that we can prevent potential racing conditions
      -- between the immediate payment and the scheduled cron jobs for today
      ${isDateToday(data.firstPaymentDate) ? "processing" : "active"}
    )
    RETURNING id;
  `;
    // pay bills that are not scheduled.
    if (isDateToday(data.firstPaymentDate)) {
      const bill: Bill = {
        id: result[0].id,
        accountId: Number(accountId),
        walletId: data.walletId,
        amount: data.amount,
        payMethod: data.payMethod,
        billDisplayName: data.billDisplayName,
        billerBsb: data.billerBsb,
        billerBankAccountNumber: data.billerBankAccountNumber,
        billerBpayCode: data.billerBpayCode?.toString(),
        billerBpayRef: data.billerBpayRef,
      };
      await payBillAction(bill);
    }
    res.status(200).json({ billId: result[0].id });
  } catch (error) {
    console.error("Error creating bill payments:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }

  // Check the payment limit the user set
  checkPaymentLimitForWalletId(data.walletId.toString());

  return;
}

// Get the a user's upcoming bills to show in the frontend.
export async function getUpcomingBills(req: Request, res: Response) {
  // get user id
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  try {
    let results: UpcomingBillRes[] = [];
    // Get the upcoming bills. We only fetch bills that are
    // after today (avoid issues that may happen when we do
    // scheduled jobs for all the scheduled payments due that day
    // at the same time) and active.
    await sql.begin(async (sql) => {
      await sql`SET TIME ZONE 'Australia/Sydney'`;
      results = await sql<UpcomingBillRes[]>`
      SELECT 
        bp.id AS "billId",
        bp.type,
        bp.bill_display_name AS "billDisplayName",
        bp.biller_display_name AS "billerDisplayName",
        bp.biller_bsb AS "billerBsb",
        bp.biller_bank_account_number AS "billerBankAccountNumber",
        bp.biller_bpay_code AS "billerBpayCode",
        bp.biller_bpay_ref AS "billerBpayRef",
        bp.amount,
        bp.next_run_at AS "nextRunAt",
        c.code AS "currencyCode"
      FROM bill_payments bp
      JOIN wallets w ON bp.wallet_id = w.wallet_id
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE bp.status = 'active' 
        AND bp.next_run_at::date > CURRENT_DATE
        AND bp.next_run_at::date > CURRENT_DATE
    `;
    });

    res.status(200).send(results);
    return;
  } catch (error) {
    console.error("Error fetching bill payments:", error);
    res.status(500).send({ error: "Internal Server Error" });
    return;
  }
}

// This function cancels an upcoming bill of the given id.
export async function cancelUpcomingBillById(
  req: Request<CancelBillParams>,
  res: Response
) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const idStr = req.params?.id;

  // not a string or not a string of numbers
  if (typeof idStr !== "string" || !/^\d+$/.test(idStr)) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  const billId = Number(idStr);
  // can't be negative
  if (billId <= 0) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  try {
    const result = await sql`
      UPDATE bill_payments
      SET status = 'cancelled'
      WHERE id = ${billId}
        AND status = 'active'
        AND next_run_at > now()
      RETURNING *;
    `;

    if (result.length === 0) {
      res.status(400).json({
        error: "Bill cannot be cancelled. It may already be due or not exist.",
      });
      return;
    }

    res.status(200).json({ message: "Bill cancelled successfully." });
    return;
  } catch (err) {
    console.error("Error cancelling bill:", err);
    res.status(500).json({ error: "Internal server error." });
    return;
  }
}

// Get the user's wallets to pay bill.
export async function getAvailableWallets(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  try {
    const account_id = await getAccountId(firebase_id);

    if (!account_id) {
      res.status(404).json({ error: "Account not found." });
      return;
    }

    const wallets = await sql`
      SELECT 
        w.wallet_id AS "walletId", 
        w.balance,
        c.code AS currency
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.account_id = ${account_id}
    `;

    res.status(200).json(wallets);
    return;
  } catch (err) {
    console.error("Error fetching wallets:", err);
    res.status(500).json({ error: "Something went wrong." });
    return;
  }
}

// This function gives the details of a saved bill.
export async function getSavedBillById(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const account_id = await getAccountId(firebase_id);

  const idStr = req.params?.id;

  // not a string or not a string of numbers
  if (typeof idStr !== "string" || !/^\d+$/.test(idStr)) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  const billId = Number(idStr);
  // can't be negative
  if (billId <= 0) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  try {
    const results = await sql.begin(async (sql) => {
      await sql`SET TIME ZONE 'Australia/Sydney'`;
      const rows = await sql<SavedBillRes[]>`
        SELECT 
          bp.wallet_id AS "walletId",
          bp.amount,
          bp.pay_method AS "payMethod",

          bp.biller_bsb AS "billerBsb",
          bp.biller_bank_account_number AS "billerBankAccountNumber",
          bp.biller_bpay_code AS "billerBpayCode",
          bp.biller_bpay_ref AS "billerBpayRef",

          bp.biller_display_name AS "billerDisplayName",
          bp.bill_display_name AS "billDisplayName",

          bp.type,
          bp.frequency,
          bp.first_payment_date AS "firstPaymentDate",

          bp.reminder,
          bp.remind_before_num_days AS "reminderDays",

          bp.next_run_at AS "nextRunAt",
          c.code AS "currencyCode"
        FROM bill_payments bp
        JOIN wallets w ON bp.wallet_id = w.wallet_id
        JOIN currencies c ON w.currency_id = c.currency_id
        WHERE bp.id = ${billId}
          AND bp.account_id = ${account_id}
      `;

      return rows;
    });

    if (results.length === 0) {
      res.status(404).json({ error: "Bill not found." });
      return;
    }
    res.status(200).json(results[0]);
  } catch (err) {
    console.error("Failed to fetch bill", err);
    res.status(500).json({ error: "Failed to fetch bill." });
  }
}

// This function PATCH the update to an existing bill.
export async function updateBillInfo(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const idStr = req.params?.id;

  // not a string or not a string of numbers
  if (typeof idStr !== "string" || !/^\d+$/.test(idStr)) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  const billId = Number(idStr);
  // can't be negative
  if (billId <= 0) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  // input validation
  const parseResult = billPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res
      .status(400)
      .json({ error: "Validation failed", issues: parseResult.error.issues });
    return;
  }

  const data = parseResult.data;
  const account_id = await getAccountId(firebase_id);

  // Ensure the bill exists and belongs to the user, other wise, deny access
  const existing = await sql`
    SELECT id FROM bill_payments 
    WHERE id = ${billId} AND account_id = ${account_id}
  `;
  if (existing.length === 0) {
    res.status(404).json({ error: "Bill not found or access denied." });
    return;
  }

  // Can't have time travel behavior to pay a bill before today
  if (
    toDateOnlyString(new Date(data.firstPaymentDate)) <
    toDateOnlyString(new Date())
  ) {
    res.status(400).json({
      error: "Please enter a valid payment date. (It has to be today or after)",
    });
    return;
  }

  try {
    const result = await sql`
      UPDATE bill_payments
      SET
        wallet_id = ${data.walletId},
        amount = ${data.amount},
        pay_method = ${data.payMethod},
        biller_bsb = ${data.billerBsb ?? null},
        biller_bank_account_number = ${data.billerBankAccountNumber ?? null},
        biller_bpay_code = ${data.billerBpayCode ?? null},
        biller_bpay_ref = ${data.billerBpayRef ?? null},
        biller_display_name = ${data.billerDisplayName ?? null},
        bill_display_name = ${data.billDisplayName ?? null},
        type = ${data.type},
        first_payment_date = ${data.firstPaymentDate ?? null},
        next_run_at = ${data.firstPaymentDate ?? null},
        frequency = ${data.frequency ?? null},
        reminder = ${data.reminder ?? false},
        remind_before_num_days = ${data.reminderDays ?? null}
      WHERE id = ${billId} AND account_id = ${account_id}
      RETURNING id;
    `;

    res.status(200).json({ billId: result[0].id });
    return;
  } catch (err: any) {
    console.error("Failed to update bill", err);
    res.status(500).json({ error: "Failed to update bill." });
    return;
  }
}

// Only get the date part of Date
export function toDateOnlyString(date: Date): string {
  return date.toISOString().split("T")[0]; // "2025-08-04"
}

// Check if given date is today.
export function isDateToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}
