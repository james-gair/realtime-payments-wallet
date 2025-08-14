import sql from "../../database/client";
import {
  getPaymentLimits,
  postPaymentLimits,
} from "../../handlers/paymentLimits";
import { PaymentLimit } from "../../types/paymentLimits";

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

const limits: PaymentLimit[] = [
  { walletId: "3", limit: 1000, currency: "AUD" },
  { walletId: "2", limit: 500, currency: "USD" },
  { walletId: "7", limit: null, currency: "JPY" },
];

jest.mock("../../database/client");

describe("getPaymentLimits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await getPaymentLimits(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });
  it("successully sends the sql result", async () => {
    (sql as any as jest.Mock).mockResolvedValue(limits);
    await getPaymentLimits(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ limits });
  });

  it("500 on db error", async () => {
    (sql as any as jest.Mock).mockRejectedValue(new Error("wrong"));
    await getPaymentLimits(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Internal server error" })
    );
  });
});

describe("postPaymentLimits", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await postPaymentLimits(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });
  it("200 on successful storing the changes", async () => {
    const req = {
      ...mockReq,
      body: {
        limits: [
          { walletId: "3", limit: 1000 },
          { walletId: "9", limit: 200 },
        ],
      },
    };
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ wallet_id: 3 }])
      .mockResolvedValueOnce([{ wallet_id: 9 }]);

    await postPaymentLimits(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, updated: 2 })
    );
  });
  it("403 on wallet id error (does not exist not not belong to user)", async () => {
    const req = {
      ...mockReq,
      body: {
        limits: [
          { walletId: "3", limit: 1000 },
          { walletId: "9", limit: 200 },
        ],
      },
    };
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ wallet_id: 3 }])
      .mockResolvedValueOnce([]);

    await postPaymentLimits(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: `Wallet ID 9 does not belong to the authenticated user or does not exist.`,
      })
    );
  });
  it("400 on invalid input", async () => {
    const req = {
      ...mockReq,
      body: {
        limits: [
          { walletId: "3", limit: "rrew" },
          { walletId: "9", limit: 200 },
        ],
      },
    };

    await postPaymentLimits(req, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid input",
      })
    );
  });
});
