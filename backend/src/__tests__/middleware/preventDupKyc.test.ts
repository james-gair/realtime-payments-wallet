import { checkKycStatus } from "../../middleware/checkKycStatus";
import { preventDupKyc } from "../../middleware/preventDupKyc";
import * as isVeriedUtil from "../../utils/isUerKycVerified";

jest.mock("../../utils/isUerKycVerified");

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

    await preventDupKyc(mockReqWithoutuid, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
  it("send 400 if the user is kyc verified", async () => {
    (isVeriedUtil.isUserVerified as jest.Mock).mockReturnValue(true);

    await preventDupKyc(mockReq, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "KYC already verified",
      })
    );
  });

  it("send 500 if the there's db error", async () => {
    (isVeriedUtil.isUserVerified as jest.Mock).mockRejectedValue(
      new Error("db error")
    );

    await preventDupKyc(mockReq, mockRes, next());
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
