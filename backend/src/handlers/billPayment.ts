import { Request, Response } from "express";
import { BillInputs, billPaymentSchema } from "../schemas/billPayment.schema";
import sql from "../database/client";
import { getAccountId } from "../utils/getAccountId";
import { CancelBillParams } from "../dtos/BillPaymentReq";

export interface BillRecord {
  billId: string;
  type: "one-time" | "recurring";
  billDisplayName?: string;
  billerDisplayName?: string;
  billerBsb?: string;
  billerBankAccountNumber?: string;
  billerBpayCode?: string;
  billerBpayRef?: string;
  amount: number;
  nextRunAt: Date;
  currencyCode: string;
}

export type UpcomingBillRes = BillRecord;
export interface SavedBillRes extends BillInputs {
  currencyCode: string;
  nextRunAt: Date;
}
export async function payBill(req: Request, res: Response) {
  // get user id
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  const parseResult = billPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error(parseResult);
    return;
  }

  const data = parseResult.data;

  /**
   * TODO: pay the pay-now bills and mark it as complete if successed
   *
   */

  // Save the bill payment to db:
  // get the account_id:
  const account_id = await getAccountId(firebase_id);
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
    remind_before_num_days
  ) VALUES (
    ${account_id},
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
    ${data.reminderDays ?? null}
  )
  RETURNING id;
`;

  console.log(result);
  res.status(200).json({ billId: result[0].id });
  return;
}

export async function getUpcomingBills(req: Request, res: Response) {
  // get user id
  const firebase_id = (req as any).user?.uid;

  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  try {
    let results: UpcomingBillRes[] = [];

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
      JOIN Wallet w ON bp.wallet_id = w.wallet_id
      JOIN Currency c ON w.currency = c.currency_id
      WHERE bp.status = 'active' 
        AND bp.next_run_at > now()
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

export async function cancelUpcomingBillById(
  req: Request<CancelBillParams>,
  res: Response
) {
  const billId = Number(req.params.id);

  if (isNaN(billId)) {
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
        w.wallet_id, 
        w.balance,
        c.code AS currency_code
      FROM Wallet w
      JOIN Currency c ON w.currency = c.currency_id
      WHERE w.account = ${account_id}
    `;
    console.log(wallets);
    res.status(200).json(wallets);
    return;
  } catch (err) {
    console.error("Error fetching wallets:", err);
    res.status(500).json({ error: "Something went wrong." });
    return;
  }
}

export async function getSavedBillById(req: Request, res: Response) {
  const billId = Number(req.params.id);

  if (isNaN(billId)) {
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
        JOIN Wallet w ON bp.wallet_id = w.wallet_id
        JOIN Currency c ON w.currency = c.currency_id
        WHERE bp.status = 'active'
          AND bp.id = ${billId}
      `;

      return rows;
    });

    res.status(200).send(results);
  } catch (err) {
    console.error("Failed to fetch bill", err);
    res.status(500).json({ error: "Failed to fetch bill." });
  }
}

export async function updateBillInfo(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;
  const billId = Number(req.params.id);
  console.log(billId);
  if (!firebase_id) {
    res.status(401).json({ error: "Not authenticated. Please log in." });
    return;
  }

  if (!billId || isNaN(billId)) {
    res.status(400).json({ error: "Invalid bill ID." });
    return;
  }

  const parseResult = billPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res
      .status(400)
      .json({ error: "Validation failed", issues: parseResult.error.issues });
    return;
  }

  const data = parseResult.data;
  const account_id = await getAccountId(firebase_id);

  // Ensure the bill exists and belongs to the user
  const existing = await sql`
    SELECT id FROM bill_payments 
    WHERE id = ${billId} AND account_id = ${account_id}
  `;
  if (existing.length === 0) {
    res.status(404).json({ error: "Bill not found or access denied." });
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
