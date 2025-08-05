import sql from "../database/client";
import { Bill, InsufficientFundError } from "../types/billPayments";
import { sendEmailToUserByAccountId } from "./notifyUserByEmail";

interface BankResponse {
  success: boolean;
  externalRef?: string;
}
/**
 * pay bill -> bank transfer / bill payment
    log the transaction if successful

  1. Soft-deduct the amount from the account balance
   we can use the billPyament id here to track the soft deduction
  2. In reality, the money should go to a bank account via a bank API
  3. After the bank API confirms that the money has been received successfully, it will send us a webhook
  4. We can then perfom the real deduction from the account balance
  5. And log the transaction
 * @param billPaymentId 
 * @param account_id 
 */
export async function payBillAction(bill: Bill) {
  const softDeductionId = await softDeductBillPayment(bill);

  // Soft deduction failed
  // Do not continue
  // All the errors occured in the soft dedcution phase should
  // have been handled by the softDeductBillPayment function
  if (!softDeductionId) {
    return;
  }

  let bankResponse: BankResponse | undefined;
  let billerInfo: string;
  if (bill.payMethod === "bankAcct") {
    if (!bill.billerBsb || !bill.billerBankAccountNumber) {
      throw new Error(
        "Biller BSB and Bank Account Number are required for bank transfer"
      );
    }

    // Perform bank transfer
    bankResponse = await bankTransferBillPayment(
      bill.walletId,
      bill.billerBsb,
      bill.billerBankAccountNumber
    );
    billerInfo = `${bill.billerBsb}-${bill.billerBankAccountNumber}`;
  } else if (bill.payMethod === "bpay") {
    if (!bill.billerBpayCode || !bill.billerBpayRef) {
      throw new Error("Biller BPAY Code and Reference are required for BPAY");
    }
    // Perform BPAY
    bankResponse = await bpayBillPayment(
      bill.walletId,
      bill.billerBpayCode,
      bill.billerBpayRef
    );
    billerInfo = `${bill.billerBpayCode} with ref ${bill.billerBpayRef}`;
  } else {
    throw new Error("Unsupported payment method");
  }

  console.log(bankResponse);
  // Handle the bank response
  if (!bankResponse) {
    throw new Error(
      "Bank response is undefined in Bill Payments - payBillAction"
    );
  }

  if (bankResponse.success) {
    // Handle successful payment
    await handleSuccessfulBillPaymentToTheBank(
      softDeductionId,
      bill,
      bankResponse.externalRef || ""
    );
  } else {
    // Handle failed payment
    await handleFailedBillPaymentToTheBank(
      softDeductionId,
      bill.id,
      bill.walletId,
      bill.amount,
      bill.accountId,
      billerInfo
    );
  }
}

// Deduct the bill payment amount from the account balance
// The deduction is put into the soft deductions table
async function softDeductBillPayment(bill: Bill): Promise<number | undefined> {
  const billPaymentId = bill.id;
  const { walletId, amount } = bill;
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
        throw new InsufficientFundError("Insufficient balance");
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

    return result; // soft_deductions.id
  } catch (error) {
    if (error instanceof InsufficientFundError) {
      const billerInfo =
        bill.payMethod === "bankAcct"
          ? `BSB:${bill.billerBsb} Bank Account: ${bill.billerBankAccountNumber}`
          : `BPAY code: ${bill.billerBpayCode} ref: ${bill.billerBpayRef}`;
      sendEmailToUserByAccountId(bill.accountId, "Failed bill payment", {
        text: `Your bill payment for ${billerInfo} has failed due to insufficient fund.`,
      });
    } else {
      console.error("Soft deduction failed:", error);
      throw error;
    }
  }
}

// hit the bank API to perform bank transfer
// (* This is reusable for other bank transfer actions, not just bill payments,
//    if this has not been implemented by other teammember yet *)
async function bankTransferBillPayment(
  walletId: number | string,
  billerBsb: string,
  billerBankAccountNumber: string
): Promise<BankResponse> {
  const currencyCode = await getCurrencyCodeByWalletId(walletId);
  console.log(
    `Simulating bank transfer to ${billerBsb}-${billerBankAccountNumber} in ${currencyCode}...`
  );

  // Assuming the mock bank API gives us a simple response
  // instead of webhook response.
  // If ever we simulate a webhook, we just move the functions
  // behind this function to a webhook handler
  return new Promise((resolve) => {
    setTimeout(() => {
      // e.g. success rate if 95%
      // const isSuccess: boolean = Math.random() < 0.95;
      // for demo:
      const isSuccess = true;
      // Simulate a "successful" bank response
      resolve({
        success: isSuccess,
        externalRef: `mock-ref-${Date.now()}`,
      });
    }, 1000); // 1 second delay to simulate network call
  });
}

// hit the bank API to perform BPAY
async function bpayBillPayment(
  walletId: number | string,
  billerBpayCode: string,
  billerBpayRef: string
): Promise<BankResponse> {
  const currencyCode = await getCurrencyCodeByWalletId(walletId);
  console.log(
    `Simulating BPAY payment to ${billerBpayCode} with ref ${billerBpayRef} in ${currencyCode}...`
  );

  // Assuming the mock bank API gives us a simple response
  // instead of webhook response.
  // If ever we simulate a webhook, we just move the functions
  // behind this function to a webhook handler
  return new Promise((resolve) => {
    setTimeout(() => {
      // e.g. success rate if 95%
      // const isSuccess: boolean = Math.random() < 0.95;
      // for demo
      const isSuccess = true;
      resolve({
        success: isSuccess,
        externalRef: `bpay-ref-${Date.now()}`,
      });
    }, 1000); // 1 second simulated delay
  });
}

async function handleFailedBillPaymentToTheBank(
  softDeductionId: number,
  billPaymentId: number,
  walletId: number,
  amount: number,
  accountId: number,
  billerInfo: string // e.g. thier bank account or BPAY details to notify the user
) {
  await sql.begin(async (sql) => {
    // 1. Refund the amount back to the user's wallet
    await sql`
      UPDATE wallets
      SET balance = balance + ${amount}
      WHERE wallet_id = ${walletId}
    `;

    // 2. Update the soft_deductions status to 'failed'
    await sql`
      UPDATE soft_deductions
      SET status = 'failed'
      WHERE id = ${softDeductionId}
    `;

    // Update bill payment status to failed
    await sql`
      UPDATE bill_payments
      SET status = 'failed'
      WHERE id = ${billPaymentId}
    `;
  });

  // notify the user about the failed payment
  const textMsg = `Your bill payment to ${billerInfo} has failed. The amount of $${amount} has been refunded to your wallet.

    If this was a scheduled or recurring payment, it has been cancelled. Since the payment could not be processed this time, future attempts are also likely to fail unless the underlying issue is resolved.

    Please also review your biller information and try again when ready.`;

  await sendEmailToUserByAccountId(accountId, "Bill Payment Failed", {
    text: textMsg,
  });

  // Log the refund action
  console.log(
    `Refunded $${amount} to wallet ${walletId} for failed bill payment ${billPaymentId}`
  );
}

async function handleSuccessfulBillPaymentToTheBank(
  softDeductionId: number,
  bill: Bill,
  externalRef: string
) {
  try {
    await sql.begin(async (sql) => {
      // update soft_deductions
      await sql`
        UPDATE soft_deductions
        SET status = 'success', external_ref = ${externalRef}
        WHERE id = ${softDeductionId}
      `;

      // get bill type and frequency
      // because this affects how we deal with the next_run_at
      const result = await sql`
        SELECT type, frequency FROM bill_payments
        WHERE id = ${bill.id}
      `;

      const { type, frequency } = result[0];

      if (type === "one-time") {
        await sql`
          UPDATE bill_payments
          SET status = 'completed', last_paid_at = NOW()
          WHERE id = ${bill.id}
        `;
      } else if (type === "recurring") {
        let nextRunDateSQL;

        if (frequency === "weekly") {
          nextRunDateSQL = sql`NOW() + INTERVAL '7 days'`;
        } else if (frequency === "fortnightly") {
          nextRunDateSQL = sql`NOW() + INTERVAL '14 days'`;
        } else if (frequency === "monthly") {
          nextRunDateSQL = sql`NOW() + INTERVAL '1 month'`;
        } else {
          throw new Error(`Unknown frequency: ${frequency}`);
        }

        await sql`
          UPDATE bill_payments
          SET 
            last_paid_at = NOW(),
            next_run_at = ${nextRunDateSQL},
            status = 'active'
          WHERE id = ${bill.id}
        `;
      }
    });

    console.log(`✅ Payment ${bill.id} marked as successful.`);
    // log the transaction
    await logTransaction(bill);
  } catch (error) {
    console.error(`❌ Failed to mark payment ${bill.id} as successful:`, error);
    throw error;
  }
}

async function logTransaction(bill: Bill) {
  // ** Need to modify the getTransactions function to left join recipient wallet
  // to avoid issues with the null recipient -> this way we avoid to
  // modify the original table.
  // Bill payment details and transactions can always communicate via account_id
  // when needed.
  //
  // LEFT JOIN wallets recipient_wallet ON t.recipient_wallet_id = recipient_wallet.wallet_id
  // LEFT JOIN accounts recipient_account on recipient_wallet.account_id = recipient_account.account_id
  bill.walletId;
  try {
    const [wallet] = await sql<{ currency_id: number }[]>`
      SELECT currency_id
      FROM wallets
      WHERE wallet_id = ${bill.walletId}
    `;

    if (!wallet || !wallet.currency_id) {
      throw new Error(`Wallet with ID ${bill.walletId} not found.`);
    }

    await sql`
      INSERT INTO transactions (
        name,
        amount,
        currency,
        sender_wallet_id,
        recipient_wallet_id,
        category
      ) VALUES (
        ${bill.billDisplayName || "Bill Payment"},
        ${bill.amount},
        ${wallet.currency_id},
        ${bill.walletId},
        NULL,
        ARRAY['bill', ${bill.payMethod}]
      )
    `;

    console.log(`✅ Transaction logged for bill payment ${bill.id}`);
  } catch (error) {
    console.error(
      `❌ Failed to log transaction for bill payment ${bill.id}:`,
      error
    );
    // this should not happen
    throw error;
  }
}

async function getCurrencyCodeByWalletId(walletId: string | number) {
  try {
    // Get the currency code, which the bank will need for payments
    const result = await sql<{ currencyCode: string }[]>`
      SELECT c.code AS "currencyCode"
      FROM wallets w
      JOIN currencies c ON w.currency_id = c.currency_id
      WHERE w.wallet_id = ${walletId};
    `;
    return result.length > 0 ? result[0].currencyCode : null;
  } catch (error) {
    console.error(error);
  }
}
