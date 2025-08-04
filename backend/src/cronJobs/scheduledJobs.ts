import { CronJob } from "cron";
import cron from "node-cron";
import sql from "../database/client";
import { Bill } from "../handlers/billPayment";
import { payBillAction } from "../utils/billPayments";
import {
  sendEmailByEmail,
  sendEmailToUserByAccountId,
} from "../utils/notifyUserByEmail";

interface SoftDeductionResult {
  bill_payment_id: number;
  soft_deduction_id: number | null;
  account_id: number;
  status: "success" | "failed";
  error: string | null;
  pay_method: "bankAcct" | "bpay";
  amount: string;
  biller_bsb: string | null;
  biller_bank_account_number: string | null;
  biller_bpay_code: string | null;
  biller_bpay_ref: string | null;
}

interface BankResponse {
  soft_deduction_id: number;
  bill_payment_id: number;
  status: "success" | "failed";
  message: string;
  pay_method: "bankAcct" | "bpay";
  amount: string;
  biller_bsb?: string | null;
  biller_bank_account_number?: string | null;
  biller_bpay_code?: string | null;
  biller_bpay_ref?: string | null;
}

export interface BillReminderInfo {
  email: string;
  username: string;
  remind_before_num_days: number;
  scheduled_date: string; // use Date if you prefer
}
// argument * * * * *
// minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12), day of the week (0 - 6) (Sunday to Saturday)
// node cron uses the server local time
export function processScheduledJobs() {
  console.log("✅ Cron jobs initialized");
  // for testing, fire every minute
  //   cron.schedule("* * * * *", () => {
  //     console.log("🕐 Cron job running every minute:", new Date());
  //   });

  const payBillJob = new CronJob(
    "0 6 * * *", // 6 AM every day
    async () => {
      console.log("⏰ Running at 6 AM Sydney time:", new Date());
      await payBillsDueTodayInBulk();
      // hit the bank API, with transaction id (soft deduction id)
      // Response can be like [{result: "success", transactionId: the soft deduction id }]

      // split the failed and successful ones and do bulk operations in sql
      // including logging the transactions in the sql
      // for the failed ones, send email to the user
    },
    null,
    true, // start the job immediately, but I'll still say, job.start() 🫠
    "Australia/Sydney" // set timezone!
  );
  payBillJob.start();

  const billReminderjob = new CronJob(
    "0 8 * * *", // 8 AM every day
    async () => {
      console.log("⏰ Running at 8 AM Sydney time:", new Date());
      await sendRemindersForToday();
    },
    null,
    true, // start the job immediately, but I'll still say, job.start() 🫠
    "Australia/Sydney" // set timezone!
  );
  billReminderjob.start();
}

async function payBillsDueTodayInBulk() {
  const bills = await softDeductBillPaymentInBulk();
  const softDeductedBills = await processSoftDeductionResult(bills);
  const bankResponses = await sendBillPaymentReqToTheBankInBulk(
    softDeductedBills
  );
  await handleBankResponses(bankResponses);
}

async function softDeductBillPaymentInBulk() {
  try {
    const result = await sql<SoftDeductionResult[]>`
      SELECT * FROM soft_deduct_today_bills()
    `;
    console.log("Soft deduction result:", result);
    return result;
  } catch (error) {
    console.error("❌ Error running soft deduction job:", error);
    throw error;
  }
}

async function processSoftDeductionResult(bills: SoftDeductionResult[]) {
  const failed = bills.filter((r) => r.status === "failed");
  const successful = bills.filter((r) => r.status === "success");

  failed.forEach(async (bill) => {
    const billerInfo =
      bill.pay_method === "bankAcct"
        ? `BSB:${bill.biller_bsb} Bank Account: ${bill.biller_bank_account_number}`
        : `BPAY code: ${bill.biller_bpay_code} ref: ${bill.biller_bpay_ref}`;
    await sendEmailToUserByAccountId(bill.account_id, "Bill Payment Failed", {
      text: `Your bill payment for ${billerInfo} has failed ${
        bill.error === "Insufficient funds" ? "due to " + bill.error : ""
      }. Please check your account.`,
    });
  });
  return successful;
}

async function sendBillPaymentReqToTheBankInBulk(bills: SoftDeductionResult[]) {
  // Simulate sending to the bank
  const responses: BankResponse[] = bills.map((bill) => {
    if (bill.soft_deduction_id === null || bill.bill_payment_id === null) {
      throw new Error(
        `Soft deduction ID is null for a successful bill_payment_id=${bill.bill_payment_id}`
      );
    }

    // Randomly simulate failure or success
    const isSuccess = Math.random() < 0.95; // 95% success rate

    return {
      soft_deduction_id: bill.soft_deduction_id,
      bill_payment_id: bill.bill_payment_id,
      status: isSuccess ? "success" : "failed",
      message: isSuccess
        ? "Processed successfully by bank API"
        : "Bank API rejected payment",
      pay_method: bill.pay_method,
      amount: bill.amount,
      biller_bsb: bill.biller_bsb ?? null,
      biller_bank_account_number: bill.biller_bank_account_number ?? null,
      biller_bpay_code: bill.biller_bpay_code ?? null,
      biller_bpay_ref: bill.biller_bpay_ref ?? null,
    };
  });

  // Log responses
  for (const res of responses) {
    console.log(
      `🏦 Bank API result - Bill ID ${res.soft_deduction_id}, Status: ${res.status}, Message: ${res.message}`
    );
  }
  return responses;
}

async function handleBankResponses(bankResponses: BankResponse[]) {
  try {
    // send email to the user for failed payments
    bankResponses
      .filter((r) => r.status === "failed")
      .forEach(async (res) => {
        const billerInfo =
          res.pay_method === "bankAcct"
            ? `BSB:${res.biller_bsb} Bank Account: ${res.biller_bank_account_number}`
            : `BPAY code: ${res.biller_bpay_code} ref: ${res.biller_bpay_ref}`;
        await sendEmailToUserByAccountId(
          res.soft_deduction_id,
          "Bill Payment Failed",
          {
            text: `Your bill payment to ${billerInfo} has failed ${
              res.message ? "due to " + res.message : "due to an unknown error"
            }. Please check your account for more details.`,
          }
        );
      });

    await sql`
      SELECT process_bank_responses(${sql.json(bankResponses as any)});
    `;
  } catch (error) {
    console.error(
      "❌ Error during handling bank response in sql processing:",
      error
    );
  }
}

async function sendRemindersForToday() {
  const reminders = await sql<BillReminderInfo[]>`
    SELECT 
      a.email,
      a.username,
      bp.remind_before_num_days,
      bp.next_run_at::DATE AS scheduled_date
    FROM bill_payments bp
    JOIN accounts a ON bp.account_id = a.account_id
    WHERE 
      bp.reminder = true
      AND bp.status = 'active'
      AND bp.next_run_at::DATE - bp.remind_before_num_days = CURRENT_DATE
  `;
  reminders.forEach(async (reminder) => {
    const { email, username, scheduled_date } = reminder;
    const subject = `Bill Reminder for ${username}`;
    const message = {
      text: `This is a reminder that you have a bill due on ${scheduled_date}. Please ensure you have sufficient funds in your account to avoid any late fees.\n\nThank you!`,
    };
    await sendEmailByEmail(email, subject, message, username);
  });
}
