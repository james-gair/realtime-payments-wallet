import type { Request, Response } from "express";
import sql from "../../database/client";
import { postExchangeCurrency } from "../../handlers/dashboard";
import * as rates from "../../handlers/fxRates";

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

const createReq = (body: any, user: any = { uid: "firebase_id" }) =>
  ({ body, user } as unknown as Request);

jest.mock("../../database/client");
jest.mock("../../handlers/fxRates");

type SqlMock = jest.Mock & { begin: jest.Mock };

describe("postExchangeCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("400 when fromAmount <= 0", async () => {
    const req = createReq({
      fromCurrencyCode: "AUD",
      toCurrencyCode: "USD",
      fromAmount: 0,
    });
    const res = createMockRes();

    await postExchangeCurrency(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "negative amount err" });
  });

  it("200 on happy path, updates both wallets", async () => {
    (rates.fetchSpecificExchangeRate as jest.Mock).mockResolvedValue(0.75);

    const sqlMock = sql as unknown as SqlMock;

    let txn!: jest.Mock;
    sqlMock.begin = jest.fn().mockImplementation(async (cb: any) => {
      txn = jest
        .fn()
        // 1) accounts
        .mockResolvedValueOnce([{ account_id: 1 }])
        // 2) fromCurrency (AUD)
        .mockResolvedValueOnce([{ currency_id: 10 }])
        // 3) toCurrency (USD)
        .mockResolvedValueOnce([{ currency_id: 20 }])
        // 4) fromWallet (AUD) with sufficient balance
        .mockResolvedValueOnce([{ wallet_id: 100, balance: 500 }])
        // 5) toWallet (USD)
        .mockResolvedValueOnce([{ wallet_id: 200, balance: 50 }])
        // 6) UPDATE fromWallet
        .mockResolvedValueOnce(undefined)
        // 7) UPDATE toWallet
        .mockResolvedValueOnce(undefined);

      await cb(txn);
    });

    const req = createReq({
      fromCurrencyCode: "AUD",
      toCurrencyCode: "USD",
      fromAmount: 100,
    });
    const res = createMockRes();

    await postExchangeCurrency(req, res);

    expect(sqlMock.begin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "exchanged successfully" });

    const calls = (txn as jest.Mock).mock.calls.map(([strings]) =>
      Array.isArray(strings) ? strings.join("") : ""
    );
    expect(
      calls.some(
        (q: string) =>
          q.includes("UPDATE wallets") && q.includes("balance = balance -")
      )
    ).toBe(true);
    expect(
      calls.some(
        (q: string) =>
          q.includes("UPDATE wallets") && q.includes("balance = balance +")
      )
    ).toBe(true);
  });

  it("500 when balance is insufficient", async () => {
    (rates.fetchSpecificExchangeRate as jest.Mock).mockResolvedValue(2.0);
    const sqlMock = sql as unknown as SqlMock;

    sqlMock.begin = jest.fn().mockImplementation(async (cb: any) => {
      const txn = jest
        .fn()
        // 1) account found
        .mockResolvedValueOnce([{ account_id: 1 }])
        // 2) fromCurrency
        .mockResolvedValueOnce([{ currency_id: 10 }])
        // 3) toCurrency
        .mockResolvedValueOnce([{ currency_id: 20 }])
        // 4) fromWallet with low balance
        .mockResolvedValueOnce([{ wallet_id: 100, balance: 5 }])
        // 5) toWallet
        .mockResolvedValueOnce([{ wallet_id: 200, balance: 50 }]);
      // handler throws before UPDATEs
      await cb(txn);
    });

    const req = createReq({
      fromCurrencyCode: "AUD",
      toCurrencyCode: "USD",
      fromAmount: 10,
    });
    const res = createMockRes();

    await postExchangeCurrency(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "balance insufficient" })
    );
  });

  it("500 when currency code is unsupported", async () => {
    (rates.fetchSpecificExchangeRate as jest.Mock).mockResolvedValue(1.0);
    const sqlMock = sql as unknown as SqlMock;

    sqlMock.begin = jest.fn().mockImplementation(async (cb: any) => {
      const txn = jest
        .fn()
        // 1) account found
        .mockResolvedValueOnce([{ account_id: 1 }])
        // 2) fromCurrency missing
        .mockResolvedValueOnce([])       // []
        // 3) toCurrency (also missing or could be present; missing is fine)
        .mockResolvedValueOnce([]);      // []
      await cb(txn);
    });

    const req = createReq({
      fromCurrencyCode: "XXX",
      toCurrencyCode: "USD",
      fromAmount: 10,
    });
    const res = createMockRes();

    await postExchangeCurrency(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "currency not found/not supported" })
    );
  });

  it("500 when user missing (current handler throws on req.user)", async () => {
    const req = createReq(
      { fromCurrencyCode: "AUD", toCurrencyCode: "USD", fromAmount: 10 },
      /* user */ undefined
    );
    const res = createMockRes();

    await postExchangeCurrency(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
