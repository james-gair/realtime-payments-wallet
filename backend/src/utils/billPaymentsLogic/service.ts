import {
  handleBankResponses,
  processSoftDeductionResult,
  sendBillPaymentReqToTheBankInBulk,
} from "../../cronJobs/deps";
import { Bill } from "../../types/billPayments";
import { softDeductBillPayment } from "./billing";

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
  const bills = await softDeductBillPayment(bill);
  if (!bills) {
    throw Error("Unexpected error during softDecutBillPayment.");
  }
  const softDeductedBills = await processSoftDeductionResult(bills);
  // console.log(softDeductedBills);
  const bankResponses = await sendBillPaymentReqToTheBankInBulk(
    softDeductedBills
  );
  await handleBankResponses(bankResponses);
}
