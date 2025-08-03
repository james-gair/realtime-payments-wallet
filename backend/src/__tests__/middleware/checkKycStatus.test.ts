import { checkKycStatus } from "../../middleware/checkKycStatus";
import * as isVeriedUtil from "../../utils/kyc";

jest.mock("../../utils/kyc");

const mockReq = {
  user: {
    uid: "firebase_id",
  },
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRes = createMockRes();

const next = jest.fn();

describe("checkKycStatus", () => {
  it("send code 401 if the user is not authenticated", async () => {
    const mockReqWithoutuid = {
      user: {},
    } as any;

    await checkKycStatus(mockReqWithoutuid, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
  it("send 403 if the user is not kyc verified", async () => {
    (isVeriedUtil.isUserVerified as jest.Mock).mockReturnValue(false);

    await checkKycStatus(mockReq, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "KYC not verified",
      })
    );
  });

  it("send 500 if the there's db error", async () => {
    (isVeriedUtil.isUserVerified as jest.Mock).mockRejectedValue(
      new Error("db error")
    );

    await checkKycStatus(mockReq, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
