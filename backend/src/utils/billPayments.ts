import sql from "../database/client";
import { Bill } from "../handlers/billPayment";
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
  const softDeductionId = await softDeductBillPayment(
    bill.id,
    bill.walletId,
    bill.amount
  );

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
    throw new Error("Bank response is undefined");
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
async function softDeductBillPayment(
  billPaymentId: number,
  walletId: number,
  amount: number
): Promise<number> {
  try {
    const result = await sql.begin(async (sql) => {
      // For Update: lock the wallet row to prevent race conditions
      const wallet = await sql`
        SELECT * FROM wallets WHERE wallet_id = ${walletId} FOR UPDATE
      `;

      if (wallet.length === 0) {
        throw new Error("Wallet not found");
      }

      const walletData = wallet[0];

      if (walletData.balance < amount) {
        throw new Error("Insufficient funds");
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
    console.error("Soft deduction failed:", error);
    throw error;
  }
}

// hit the bank API to perform bank transfer
// (* This is reusable for other bank transfer actions, not just bill payments,
//    if this has not been implemented by other teammember yet *)
async function bankTransferBillPayment(
  billerBsb: string,
  billerBankAccountNumber: string
): Promise<BankResponse> {
  console.log(
    `Simulating bank transfer to ${billerBsb}-${billerBankAccountNumber}...`
  );

  // Assuming the mock bank API gives us a simple response
  // instead of webhook response.
  // If ever we simulate a webhook, we just move the functions
  // behind this function to a webhook handler
  return new Promise((resolve) => {
    setTimeout(() => {
      // e.g. success rate if 95%
      const isSuccess: boolean = Math.random() < 0.95;
      // Simulate a "successful" bank response
      resolve({
        success: isSuccess,
        externalRef: `mock-ref-${Date.now()}`,
      });
    }, 1000); // 1 second delay to simulate network call
  });
}

// hit the bank API to perform BPAY
function bpayBillPayment(
  billerBpayCode: string,
  billerBpayRef: string
): Promise<BankResponse> {
  console.log(
    `Simulating BPAY payment to ${billerBpayCode} with ref ${billerBpayRef}...`
  );

  // Assuming the mock bank API gives us a simple response
  // instead of webhook response.
  // If ever we simulate a webhook, we just move the functions
  // behind this function to a webhook handler
  return new Promise((resolve) => {
    setTimeout(() => {
      // e.g. success rate if 95%
      const isSuccess: boolean = Math.random() < 0.95;

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

    Please review your biller information and try again when ready.`;

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
      // 1. Update soft_deductions
      await sql`
        UPDATE soft_deductions
        SET status = 'success', external_ref = ${externalRef}
        WHERE id = ${softDeductionId}
      `;

      // 2. Get bill type and frequency
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
    // 3. Log the transaction
    await logTransaction(bill);
  } catch (error) {
    console.error(`❌ Failed to mark payment ${bill.id} as successful:`, error);
    // You can also choose to rethrow or return an error status
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

  try {
    await sql`
      INSERT INTO transactions (
        name,
        amount,
        sender_wallet_id,
        recipient_wallet_id,
        category
      ) VALUES (
        ${bill.billDisplayName || "Bill Payment"},
        ${bill.amount},
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
