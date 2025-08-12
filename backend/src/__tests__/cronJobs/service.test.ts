import * as deps from "../../cronJobs/deps";
import { payBillsDueTodayInBulk } from "../../cronJobs/service";

jest.mock("../../cronJobs/deps");

describe("payBillsDueTodayInBulk", () => {
  it("runs each dep function", () => {
    const softResults = [
      {
        bill_payment_id: 1,
        soft_deduction_id: 10,
        account_id: 7,
        status: "success",
        error: null,
        pay_method: "bankAcct",
        amount: "50.00",
        biller_bsb: "325235425",
        biller_bank_account_number: "423434",
        biller_bpay_code: null,
        biller_bpay_ref: null,
      },
      {
        bill_payment_id: 2,
        soft_deduction_id: 11,
        account_id: 8,
        status: "failed",
        error: "Insufficient funds",
        pay_method: "bpay",
        amount: "20.00",
        biller_bsb: null,
        biller_bank_account_number: null,
        biller_bpay_code: "243424",
        biller_bpay_ref: "wetretrt",
      },
    ];

    const processedSuccess = [softResults[0]];

    const bankResponses = [
      {
        bill_payment_id: 1,
        soft_deduction_id: 10,
        status: "success",
        pay_method: "bankAcct",
        amount: "50.00",
        biller_bsb: "325235425",
        biller_bank_account_number: "423434",
        biller_bpay_code: null,
        biller_bpay_ref: null,
      },
    ];

    (deps.softDeductBillPaymentInBulk as jest.Mock).mockResolvedValueOnce(
      softResults
    );
    (deps.processSoftDeductionResult as jest.Mock).mockResolvedValueOnce(
      processedSuccess
    );
    (deps.sendBillPaymentReqToTheBankInBulk as jest.Mock).mockResolvedValueOnce(
      bankResponses
    );
    (deps.handleBankResponses as jest.Mock).mockResolvedValueOnce(undefined);

    return payBillsDueTodayInBulk().then(() => {
      expect(deps.softDeductBillPaymentInBulk).toHaveBeenCalledTimes(1);
      expect(deps.processSoftDeductionResult).toHaveBeenCalledWith(softResults);
      expect(deps.sendBillPaymentReqToTheBankInBulk).toHaveBeenCalledWith(
        processedSuccess
      );
      expect(deps.handleBankResponses).toHaveBeenCalledWith(bankResponses);
    });
  });
});
