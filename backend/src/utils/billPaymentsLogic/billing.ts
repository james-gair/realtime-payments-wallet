// Deduct the bill payment amount from the account balance

import sql from "../../database/client";
import { Bill } from "../../types/billPayments";
import { SoftDeductionResult } from "../../types/scheduledJobs";

// The deduction is put into the soft deductions table
export async function softDeductBillPayment(
  bill: Bill
): Promise<SoftDeductionResult[] | undefined> {
  const billPaymentId = bill.id;
  const { walletId, amount } = bill;
  let error = undefined;
  try {
    const result = await sql.begin(async (sql) => {
      // For Update: lock the wallet row to prevent race conditions
      // This operation will rollback if any errors are thrown in the process
      const walletBalance = await sql`
        SELECT balance FROM wallets WHERE wallet_id = ${walletId} FOR UPDATE
      `;

      if (walletBalance.length === 0) {
        throw new Error("Wallet not found");
      }
      // No change to the balance if there's insufficient fund
      // Throw the error
      if (Number(walletBalance[0].balance) < Number(amount)) {
        error = "Insufficient funds";
        return undefined;
      }

      // Deduct from wallet
      await sql`
        UPDATE wallets
        SET balance = balance - ${amount}
        WHERE wallet_id = ${walletId}
      `;

      // Insert soft deduction and return its ID
      const inserted = await sql`
        INSERT INTO soft_deductions (bill_payment_id)
        VALUES (${billPaymentId})
        RETURNING id;
      `;

      return inserted[0].id;
    });

    if (bill.payMethod !== "bankAcct" && bill.payMethod !== "bpay")
      throw Error("invalid payment method.");

    return [
      {
        bill_payment_id: bill.id,
        soft_deduction_id: result,
        account_id: bill.accountId,
        status: result ? "success" : "failed",
        error: error ?? null,
        pay_method: bill.payMethod,
        amount: bill.amount.toString(),
        biller_bsb: bill.billerBsb ?? null,
        biller_bank_account_number: bill.billerBankAccountNumber ?? null,
        biller_bpay_code: bill.billerBpayCode ?? null,
        biller_bpay_ref: bill.billerBpayRef ?? null,
      },
    ];
  } catch (error) {
    console.error("Soft deduction failed:", error);
    throw error;
  }
}
