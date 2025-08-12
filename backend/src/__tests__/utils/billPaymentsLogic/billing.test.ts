import sql from "../../../database/client";
import { softDeductBillPayment } from "../../../utils/billPaymentsLogic/billing";

jest.mock("../../../database/client");

const bill = {
  id: 1,
  accountId: 100,
  walletId: 1,
  amount: 50,
  payMethod: "bankAcct",
  billerBsb: "123456",
  billerBankAccountNumber: "654321",
  billDisplayName: "Electricity",
} as any;

describe("softDeductBillPayment", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("throws an error if wallet is not found", async () => {
    type SqlMock = jest.Mock & { begin: jest.Mock };
    const sqlMock = sql as any as SqlMock;
    let transactionSQL: jest.Mock;

    sqlMock.begin.mockImplementation(async (callback: any) => {
      transactionSQL = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(1);

      return await callback(transactionSQL);
    });
    await expect(softDeductBillPayment(bill)).rejects.toThrow(
      "Wallet not found"
    );
  });

  it("sucessfully made soft deduction and returns soft deduction result", async () => {
    type SqlMock = jest.Mock & { begin: jest.Mock };
    const sqlMock = sql as any as SqlMock;
    let transactionSQL: jest.Mock;

    sqlMock.begin.mockImplementation(async (callback: any) => {
      transactionSQL = jest
        .fn()
        .mockResolvedValueOnce([{ balance: 1000 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 99 }]);

      return await callback(transactionSQL);
    });
    const result = await softDeductBillPayment(bill);
    expect(result).toEqual([
      {
        bill_payment_id: bill.id,
        soft_deduction_id: 99,
        account_id: bill.accountId,
        status: "success",
        error: null,
        pay_method: bill.payMethod,
        amount: bill.amount.toString(),
        biller_bsb: bill.billerBsb,
        biller_bank_account_number: bill.billerBankAccountNumber,
        biller_bpay_code: null,
        biller_bpay_ref: null,
      },
    ]);
  });
});
