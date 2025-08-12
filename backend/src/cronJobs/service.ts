import {
  handleBankResponses,
  processSoftDeductionResult,
  sendBillPaymentReqToTheBankInBulk,
  softDeductBillPaymentInBulk,
} from "./deps";

export async function payBillsDueTodayInBulk() {
  const bills = await softDeductBillPaymentInBulk();
  const softDeductedBills = await processSoftDeductionResult(bills);
  const bankResponses = await sendBillPaymentReqToTheBankInBulk(
    softDeductedBills
  );
  await handleBankResponses(bankResponses);
}
