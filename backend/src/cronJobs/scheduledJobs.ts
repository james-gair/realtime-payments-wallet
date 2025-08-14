import { CronJob } from "cron";
import { payBillsDueTodayInBulk } from "./service";
import { sendRemindersForToday } from "./deps";

// argument * * * * *
// minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12), day of the week (0 - 6) (Sunday to Saturday)
// node cron uses the server local time
export function processScheduledJobs() {
  console.log("✅ Cron jobs initialized");

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
