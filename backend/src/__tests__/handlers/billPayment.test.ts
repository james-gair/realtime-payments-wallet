import sql from "../../database/client";
import {
  cancelUpcomingBillById,
  getAvailableWallets,
  getSavedBillById,
  getUpcomingBills,
  isDateToday,
  payBill,
  toDateOnlyString,
  updateBillInfo,
} from "../../handlers/billPayment";
import * as billutils from "../../utils/billPayments";
import * as getAccountId from "../../utils/getAccountId";

const mockReq = {
  user: {
    uid: "firebase_id",
  },
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockRes = createMockRes();

jest.mock("../../database/client");
jest.mock("../../services/checkPaymentLimits");
jest.mock("../../utils/billPayments");
jest.mock("../../utils/getAccountId");
jest.mock("../../services/checkPaymentLimits");

describe("payBill", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await payBill(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });
  it("sends 400 on invalid body (Zod safeParse fails)", async () => {
    const req: any = {
      ...mockReq,
      body: {}, // nothing sent to the backend
    };

    await payBill(req, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  it("sends 400 when there's not enough funds for paying the bill", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const req: any = {
      ...mockReq,
      body: {
        walletId: 1,
        amount: "10.00",
        payMethod: "bankAcct",
        type: "one-time",
        firstPaymentDate: today,
        billerBsb: "879879",
        billerBankAccountNumber: "7687687",
      },
    };
    const res = mockRes;

    (sql as any as jest.Mock).mockResolvedValueOnce([{ balance: 1 }]);

    await payBill(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Insufficient"),
      })
    );
  });

  it("sends 200 and triggers payBillAction when paying today with enough funds", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const req: any = {
      ...mockReq,
      body: {
        walletId: 1,
        amount: "10.00",
        payMethod: "bankAcct",
        type: "one-time",
        firstPaymentDate: today,
        billerBsb: "879879",
        billerBankAccountNumber: "7687687",
      },
    };
    const res = createMockRes();
    (getAccountId.getAccountId as jest.Mock).mockResolvedValue(42);
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ balance: 10980909 }])
      .mockResolvedValueOnce([{ id: 123 }]);

    await payBill(req, res);

    expect(sql).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ billId: 123 });
    expect(billutils.payBillAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 123, amount: 10, walletId: 1 })
    );
  });
});

describe("getUpcomingBills", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await payBill(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });

  it("sends 200 with upcoming bills (happy path)", async () => {
    const req = mockReq;
    const res = mockRes;

    const rows = [
      {
        billId: 1,
        type: "one-time",
        billDisplayName: "Elec",
        billerDisplayName: "AGL",
        billerBsb: "234324",
        billerBankAccountNumber: "42342342",
        billerBpayCode: null,
        billerBpayRef: null,
        amount: 50,
        nextRunAt: "2025-08-20",
        currencyCode: "AUD",
      },
    ];

    type SqlMock = jest.Mock & { begin: jest.Mock };
    const sqlMock = sql as unknown as SqlMock;
    let transactionSQL: jest.Mock;

    sqlMock.begin.mockImplementation(async (callback: any) => {
      transactionSQL = jest
        .fn()
        // set timezone
        .mockResolvedValueOnce(undefined)
        // query SELECT upcoming bills
        .mockResolvedValueOnce(rows);

      await callback(transactionSQL);
    });

    await getUpcomingBills(req, res);

    expect(sqlMock.begin).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(rows);
  });

  it("sends 500 on DB error", async () => {
    const req = mockReq;
    const res = mockRes;

    type SqlMock = jest.Mock & { begin: jest.Mock };
    const sqlMock = sql as unknown as SqlMock;

    sqlMock.begin.mockRejectedValueOnce(new Error("DB drror"));

    await getUpcomingBills(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});

describe("cancelUpcomingBillById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends 400 for invalid id", async () => {
    const req = {
      ...mockReq,
      params: { id: null },
    } as any;
    const res = mockRes;

    await cancelUpcomingBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid bill ID." });
  });

  it("sends 200 when cancellation succeeds", async () => {
    const req = {
      ...mockReq,
      params: { id: "1" },
    } as any;
    const res = mockRes;

    (sql as any as jest.Mock).mockResolvedValueOnce([
      { id: 1, status: "cancelled" },
    ]);

    await cancelUpcomingBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bill cancelled successfully.",
    });
  });

  it("sends 400 when bill cannot be cancelled", async () => {
    const req = { ...mockReq, params: { id: "1" } } as any;
    const res = mockRes;

    // no such bill exists
    (sql as any as jest.Mock).mockResolvedValueOnce([]);

    await cancelUpcomingBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Bill cannot be cancelled. It may already be due or not exist.",
    });
  });

  it("500 on DB error", async () => {
    const req = { ...mockReq, params: { id: "1" } } as any;
    const res = mockRes;

    (sql as any as jest.Mock).mockRejectedValueOnce(new Error("DB down"));

    await cancelUpcomingBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error." });
  });
});

describe("getAvailableWallets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await payBill(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });

  it("successfully sends the wallets info", async () => {
    (getAccountId.getAccountId as jest.Mock).mockResolvedValueOnce("1");
    const rows = [
      {
        walletId: 3,
        balance: 342,
        currency: "AUD",
      },
    ];

    (sql as any as jest.Mock).mockResolvedValueOnce(rows);
    await getAvailableWallets(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(rows);
  });
});

describe("getSavedBillById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await payBill(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });
  it("sends 400 for invalid id", async () => {
    const req = {
      ...mockReq,
      params: { id: null },
    } as any;
    const res = mockRes;

    await getSavedBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid bill ID." });
  });
  it("sends 200 with the saved bill", async () => {
    const req = {
      ...mockReq,
      params: { id: "1" },
    } as any;
    const res = mockRes;
    (getAccountId.getAccountId as jest.Mock).mockResolvedValueOnce("1");
    const rows = [
      {
        walletId: 1,
        amount: "30",
        payMethod: "bankAcct",
        billerBsb: "545443",
        billerBankAccountNumber: "432423433",
        billerBpayCode: null,
        billerBpayRef: null,
        billerDisplayName: "AGL",
        billDisplayName: "Elec",
        type: "one-time",
        frequency: null,
        firstPaymentDate: "2025-12-20",
        reminder: false,
        reminderDays: null,
        nextRunAt: "2025-12-20",
        currencyCode: "AUD",
      },
    ];

    type SqlMock = jest.Mock & { begin: jest.Mock };
    const sqlMock = sql as unknown as SqlMock;

    let transactionSQLSql: jest.Mock;
    sqlMock.begin.mockImplementation(async (cb: any) => {
      transactionSQLSql = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(rows);
      return await cb(transactionSQLSql);
    });
    await getSavedBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rows[0]);
  });
});

describe("updateBillInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await payBill(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });
  it("sends 400 for invalid id", async () => {
    const req = {
      ...mockReq,
      params: { id: null },
    } as any;
    const res = mockRes;

    await getSavedBillById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid bill ID." });
  });
  it("successfully updated the bill", async () => {
    const validBody = {
      walletId: 1,
      amount: 10,
      payMethod: "bankAcct",
      billerBsb: "687678",
      billerBankAccountNumber: "7679879",
      billerDisplayName: "AGL",
      billDisplayName: "Electricity",
      type: "one-time",
      firstPaymentDate: new Date().toISOString().slice(0, 10),
      reminder: false,
    };
    const req = { ...mockReq, params: { id: "1" }, body: validBody };
    const res = mockRes;
    (getAccountId.getAccountId as jest.Mock).mockResolvedValue("1");
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ id: 2 }])
      .mockResolvedValueOnce([{ id: 45 }]);
    await updateBillInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ billId: 45 });
  });
  it("prevents time travel behavior and sends 400 if firstpayment date is a past date", async () => {
    const validBody = {
      walletId: 1,
      amount: 10,
      payMethod: "bankAcct",
      billerBsb: "687678",
      billerBankAccountNumber: "7679879",
      billerDisplayName: "AGL",
      billDisplayName: "Electricity",
      type: "one-time",
      firstPaymentDate: "2024-01-01",
      reminder: false,
    };
    const req = { ...mockReq, params: { id: "1" }, body: validBody };
    const res = mockRes;
    (getAccountId.getAccountId as jest.Mock).mockResolvedValue("1");
    (sql as any as jest.Mock).mockResolvedValueOnce([{ id: 2 }]);
    await updateBillInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it("sends 404 when no such bill was found", async () => {
    const validBody = {
      walletId: 1,
      amount: 10,
      payMethod: "bankAcct",
      billerBsb: "687678",
      billerBankAccountNumber: "7679879",
      billerDisplayName: "AGL",
      billDisplayName: "Electricity",
      type: "one-time",
      firstPaymentDate: "2024-01-01",
      reminder: false,
    };
    const req = { ...mockReq, params: { id: "101" }, body: validBody };
    const res = mockRes;
    (getAccountId.getAccountId as jest.Mock).mockResolvedValue("1");
    (sql as any as jest.Mock).mockResolvedValueOnce([]);
    await updateBillInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Bill not found or access denied.",
      })
    );
  });
  it("sends 400 for invalid body", async () => {
    const inValidBody = {
      walletId: 1,
      amount: 10,
      payMethod: "bankAcct",

      billerDisplayName: "AGL",
      billDisplayName: "Electricity",
      type: "one-time",
      firstPaymentDate: "2024-01-01",
      reminder: false,
    };
    const req = { ...mockReq, params: { id: "101" }, body: inValidBody };
    const res = mockRes;
    (getAccountId.getAccountId as jest.Mock).mockResolvedValue("1");

    await updateBillInfo(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
      })
    );
  });
});

describe("toDateOnlyString", () => {
  it("returns YYYY-MM-DD for a UTC date", () => {
    const d = new Date(Date.UTC(2025, 7, 4, 12, 0, 0));
    expect(toDateOnlyString(d)).toBe("2025-08-04");
  });

  it("reflects UTC", () => {
    const d = new Date("2025-08-10T00:30:00+10:00");
    expect(toDateOnlyString(d)).toBe("2025-08-09");
  });
});

describe("isDateToday", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("true for the same day", () => {
    jest.setSystemTime(new Date("2025-08-10"));

    expect(isDateToday(new Date("2025-08-10"))).toBe(true);
  });

  it("false for different days", () => {
    jest.setSystemTime(new Date("2025-08-10"));

    expect(isDateToday(new Date("2025-08-08"))).toBe(false);
  });
});
