import * as deps from "../../../cronJobs/deps";
import { Bill } from "../../../types/billPayments";
import * as billing from "../../../utils/billPaymentsLogic/billing";
import { payBillAction } from "../../../utils/billPaymentsLogic/service";

jest.mock("../../../cronJobs/deps");
jest.mock("../../../utils/billPaymentsLogic/billing");

describe("payBillAction", () => {
  it("runs each dep function", async () => {
    const bill: Bill = {
      id: 1,
      accountId: 7,
      walletId: 3,
      amount: 50,
      payMethod: "bankAcct",
      billerBsb: "325235425",
      billerBankAccountNumber: "423434",
      billDisplayName: "Electricity",
    };
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

    (billing.softDeductBillPayment as jest.Mock).mockResolvedValueOnce(
      softResults
    );
    (deps.processSoftDeductionResult as jest.Mock).mockResolvedValueOnce(
      processedSuccess
    );
    (deps.sendBillPaymentReqToTheBankInBulk as jest.Mock).mockResolvedValueOnce(
      bankResponses
    );
    (deps.handleBankResponses as jest.Mock).mockResolvedValueOnce(undefined);

    await payBillAction(bill);
    expect(billing.softDeductBillPayment).toHaveBeenCalledTimes(1);
    expect(billing.softDeductBillPayment).toHaveBeenCalledWith(bill);

    expect(deps.processSoftDeductionResult).toHaveBeenCalledTimes(1);
    expect(deps.processSoftDeductionResult).toHaveBeenCalledWith(softResults);

    expect(deps.sendBillPaymentReqToTheBankInBulk).toHaveBeenCalledTimes(1);
    expect(deps.sendBillPaymentReqToTheBankInBulk).toHaveBeenCalledWith(
      processedSuccess
    );

    expect(deps.handleBankResponses).toHaveBeenCalledTimes(1);
    expect(deps.handleBankResponses).toHaveBeenCalledWith(bankResponses);
  });
});
