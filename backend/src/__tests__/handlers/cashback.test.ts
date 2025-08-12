import type { Request, Response } from "express";
import sql from "../../database/client";
import { postSendMoney } from "../../handlers/sendMoney"; // <-- adjust if different

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};
const createReq = (body: any, user: any = { uid: "sender_firebase" }) =>
  ({ body, user } as unknown as Request);

jest.mock("../../database/client");

type SqlMock = jest.Mock & { begin: jest.Mock };

describe("postSendMoney (username + cashback)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("200 sending via username with eligible cashback (three UPDATEs: debit, credit, cashback)", async () => {
    const amount = 25;
    const cashback = 2;
    const senderWalletId = 111;
    const recipientWalletId = 222;

    const sqlMock = sql as unknown as SqlMock;

    let txn!: jest.Mock;
    sqlMock.begin = jest.fn().mockImplementation(async (cb: any) => {
      txn = jest
        .fn()
        // 1) sender account
        .mockResolvedValueOnce([{ account_id: 1, username: "alice" }])
        // 2) currency
        .mockResolvedValueOnce([{ currency_id: 10 }])
        // 3) sender wallet (string balance to mimic DB)
        .mockResolvedValueOnce([{ wallet_id: senderWalletId, balance: "100.00" }])
        // 4) recipient account by username
        .mockResolvedValueOnce([
          { account_id: 2, username: "bob", first_name: "Bob", last_name: "Smith" },
        ])
        // 5) recipient wallet
        .mockResolvedValueOnce([{ wallet_id: recipientWalletId, balance: "50.00" }])
        // 6) UPDATE sender (debit)
        .mockResolvedValueOnce(undefined)
        // 7) UPDATE recipient (credit)
        .mockResolvedValueOnce(undefined)
        // 8) INSERT transaction RETURNING id
        .mockResolvedValueOnce([{ transaction_id: 999 }])
        // 9) SELECT cashback_deals for recipient wallet
        .mockResolvedValueOnce([
          {
            deal_id: 1,
            deal_wallet_id: recipientWalletId,
            min_spend_amount: 10,
            cashback_amount: cashback,
          },
        ])
        .mockResolvedValueOnce(undefined);

      return await cb(txn);
    });

    const req = createReq({
      recipientUsername: "bob",
      currencyCode: "AUD",
      amount,
      description: "test transfer",
    });
    const res = createMockRes();

    await postSendMoney(req, res);

    expect(sqlMock.begin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Transfer successful",
        transactionId: 999,
        recipientName: "Bob Smith",
        transferType: "sendit_account",
      })
    );

    const updateCalls = txn.mock.calls.filter(
      ([strings]) => Array.isArray(strings) && strings.join("").includes("UPDATE wallets")
    );
    expect(updateCalls.length).toBe(3);

    const minusCalls = updateCalls.filter(([strings]) =>
      (strings as string[]).join("").includes("balance = balance -")
    );
    const plusCalls = updateCalls.filter(([strings]) =>
      (strings as string[]).join("").includes("balance = balance +")
    );
    expect(minusCalls.length).toBe(1);
    expect(plusCalls.length).toBe(2);

    const cashbackCall = plusCalls.find(([_strings, firstValue]) => firstValue === cashback);
    expect(cashbackCall).toBeTruthy();

    const debitCall = minusCalls[0];
    expect(debitCall?.[1]).toBe(amount);
    expect(debitCall?.[2]).toBe(senderWalletId);
  });

  it("200 sending via username with NO cashback when below min spend (two UPDATEs: debit, credit)", async () => {
    const amount = 25;
    const minSpend = 100; 
    const senderWalletId = 333;
    const recipientWalletId = 444;

    const sqlMock = sql as unknown as SqlMock;

    let txn!: jest.Mock;
    sqlMock.begin = jest.fn().mockImplementation(async (cb: any) => {
      txn = jest
        .fn()
        // 1) sender account
        .mockResolvedValueOnce([{ account_id: 3, username: "carol" }])
        // 2) currency
        .mockResolvedValueOnce([{ currency_id: 20 }])
        // 3) sender wallet
        .mockResolvedValueOnce([{ wallet_id: senderWalletId, balance: "500.00" }])
        // 4) recipient account by username
        .mockResolvedValueOnce([{ account_id: 4, username: "dave" }])
        // 5) recipient wallet
        .mockResolvedValueOnce([{ wallet_id: recipientWalletId, balance: "10.00" }])
        // 6) UPDATE sender (debit)
        .mockResolvedValueOnce(undefined)
        // 7) UPDATE recipient (credit)
        .mockResolvedValueOnce(undefined)
        // 8) INSERT transaction RETURNING id
        .mockResolvedValueOnce([{ transaction_id: 1001 }])
        // 9) SELECT cashback_deals deal exists but min_spend not met
        .mockResolvedValueOnce([
          {
            deal_id: 2,
            deal_wallet_id: recipientWalletId,
            min_spend_amount: minSpend,
            cashback_amount: 5,
          },
        ]);

      return await cb(txn);
    });

    const req = createReq({
      recipientUsername: "dave",
      currencyCode: "AUD",
      amount,
    });
    const res = createMockRes();

    await postSendMoney(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Transfer successful",
        transactionId: 1001,
        transferType: "sendit_account",
      })
    );

    // no cashback
    const updateCalls = txn.mock.calls.filter(
      ([strings]) => Array.isArray(strings) && strings.join("").includes("UPDATE wallets")
    );
    expect(updateCalls.length).toBe(2);

    const minusCalls = updateCalls.filter(([strings]) =>
      (strings as string[]).join("").includes("balance = balance -")
    );
    const plusCalls = updateCalls.filter(([strings]) =>
      (strings as string[]).join("").includes("balance = balance +")
    );
    expect(minusCalls.length).toBe(1);
    expect(plusCalls.length).toBe(1);

    const anyCashbackPlus = plusCalls.some(([_strings, firstValue]) => firstValue !== amount);
    expect(anyCashbackPlus).toBe(false);
  });
});
