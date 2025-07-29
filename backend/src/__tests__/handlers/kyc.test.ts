import FormData from "form-data";
import { kycHandler } from "../../handlers/kyc";
import * as formUtils from "../../utils/constructKycFormData";
import * as kycServices from "../../services/verifyKyc";
import { AxiosError } from "axios";
import * as kycDbUtils from "../../utils/updateKycVerificationStatus";
import * as saveIdUtils from "../../utils/saveVerifiedAccountIdInDb";

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

jest.mock("../../utils/constructKycFormData");
jest.mock("../../services/verifyKyc");
jest.mock("../../utils/updateKycVerificationStatus");
jest.mock("../../utils/saveVerifiedAccountIdInDb");

describe("kyc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("send status code 401, if user is not authenticated", async () => {
    const mockNoUserReq = {
      user: {},
    } as any;
    await kycHandler(mockNoUserReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Not authenticated. Please log in.",
      })
    );
  });

  it("send code 400, if formData sending to the mock verification API is not created successfully", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockImplementation(() => {
      throw new Error("validation failed");
    });
    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "validation failed",
      })
    );
  });

  it("send code 400, if rejected result from mock API", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );
    (kycServices.verifyKyc as jest.Mock).mockReturnValue({
      result: "rejected",
    });
    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Verification failed",
        details: { result: "rejected" },
      })
    );
  });

  it("send code any, if mock API gives other errors", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 402,
        data: { message: "other error with a response" },
      },
    } as AxiosError;

    (kycServices.verifyKyc as jest.Mock).mockRejectedValue(axiosError);

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Verification failed",
        details: { message: "other error with a response" },
      })
    );
  });

  it("send 502, if the mock API is unreachable", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );
    const axiosError = {
      isAxiosError: true,
    } as AxiosError;

    (kycServices.verifyKyc as jest.Mock).mockRejectedValue(axiosError);

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(502);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Verification service unavailable" })
    );
  });

  it("send 500, unexpected error from mock API", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );

    (kycServices.verifyKyc as jest.Mock).mockRejectedValue(
      new Error("unexpected error")
    );

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Internal server error during verification",
      })
    );
  });

  it("send 200, if user is verified susccessfully", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );

    (kycServices.verifyKyc as jest.Mock).mockReturnValue({
      result: "verified",
    });

    (kycDbUtils.updataKycVerificationStatus as jest.Mock).mockReturnValue(true);
    (saveIdUtils.saveVerifiedAccountIdInDb as jest.Mock).mockReturnValue([
      "account_id",
    ]);
    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: { result: "verified" },
      })
    );
  });

  it("send 404, if user is not found in db", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );

    (kycServices.verifyKyc as jest.Mock).mockReturnValue({
      result: "verified",
    });

    (kycDbUtils.updataKycVerificationStatus as jest.Mock).mockReturnValue(
      false
    );

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "User not found in database",
      })
    );
  });

  it("send 500, if db throws error", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );

    (kycServices.verifyKyc as jest.Mock).mockReturnValue({
      result: "verified",
    });

    (kycDbUtils.updataKycVerificationStatus as jest.Mock).mockRejectedValue(
      new Error("db error")
    );

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Database operation failed" })
    );
  });

  it("send 500, if db throws error", async () => {
    (formUtils.constructKycFormData as jest.Mock).mockReturnValue(
      new FormData()
    );

    (kycServices.verifyKyc as jest.Mock).mockReturnValue({
      result: "verified",
    });

    (kycDbUtils.updataKycVerificationStatus as jest.Mock).mockReturnValue(true);
    (saveIdUtils.saveVerifiedAccountIdInDb as jest.Mock).mockRejectedValue(
      new Error("db error")
    );

    await kycHandler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Database operation failed" })
    );
  });
});
