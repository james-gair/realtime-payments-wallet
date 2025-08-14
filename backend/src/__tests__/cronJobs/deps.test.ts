import {
  handleBankResponses,
  processSoftDeductionResult,
  sendRemindersForToday,
  softDeductBillPaymentInBulk,
} from "../../cronJobs/deps";
import sql from "../../database/client";
import {
  BankResponse,
  BillReminderInfo,
  SoftDeductionResult,
} from "../../types/scheduledJobs";
import * as notify from "../../utils/notifyUserByEmail";

jest.mock("../../utils/notifyUserByEmail");
jest.mock("../../database/client");

const softResults: SoftDeductionResult[] = [
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

describe("softDeductBillPaymentInBulk", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("returns the result", () => {
    const mockResult: any[] = [];
    (sql as unknown as jest.Mock).mockResolvedValueOnce(mockResult);
    return expect(softDeductBillPaymentInBulk()).resolves.toBe(mockResult);
  });
});

describe("processSoftDeductionResult", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("return the successful bills and send emails to failed ones", async () => {
    (notify.sendEmailToUserByAccountId as jest.Mock).mockResolvedValueOnce(
      undefined
    );

    const res = await processSoftDeductionResult(softResults);
    expect(res).toStrictEqual(processedSuccess);
    expect(notify.sendEmailToUserByAccountId).toHaveBeenCalledTimes(1);
  });
});

describe("handleBankResponses", () => {
  const bankResponses: BankResponse[] = [
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
      message: "nothing",
    },
    {
      bill_payment_id: 2,
      soft_deduction_id: 20,
      status: "failed",
      pay_method: "bankAcct",
      amount: "50.00",
      biller_bsb: "325235425",
      biller_bank_account_number: "423434",
      biller_bpay_code: null,
      biller_bpay_ref: null,
      message: "nothing",
    },
  ];

  it("send failed bill payments to usrs and go through the workflow", async () => {
    await handleBankResponses(bankResponses);

    expect(notify.sendEmailToUserByAccountId).toHaveBeenCalledTimes(1);
    expect(notify.sendEmailToUserByAccountId).toHaveBeenCalledWith(
      bankResponses[1].soft_deduction_id,
      "Bill Payment Failed",
      expect.objectContaining({
        text: expect.stringContaining("325235425"),
      })
    );

    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe("sendRemindersForToday", () => {
  const reminders: BillReminderInfo[] = [
    {
      email: "alice@example.com",
      username: "Alice",
      remind_before_num_days: 2,
      scheduled_date: "2025-08-15",
    },
    {
      email: "bob@example.com",
      username: "Bob",
      remind_before_num_days: 1,
      scheduled_date: "2025-08-16",
    },
  ];
  afterEach(() => jest.clearAllMocks());

  it("send each reminder to each user's email", async () => {
    (sql as any as jest.Mock).mockResolvedValue(reminders);
    await sendRemindersForToday();
    expect(notify.sendEmailByEmail).toHaveBeenCalledTimes(reminders.length);
  });
  it("does not send anything if no reminders to send", async () => {
    (sql as any as jest.Mock).mockResolvedValue([]);
    await sendRemindersForToday();
    expect(notify.sendEmailByEmail).not.toHaveBeenCalled();
  });
});
