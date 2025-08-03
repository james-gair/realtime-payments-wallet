import { kycSchema } from "../../schemas/kyc.schema";
import { constructKycFormData } from "../../utils/kyc";
import sql from "../../database/client";
import { isUserVerified } from "../../utils/kyc";
import { KycInput } from "../../schemas/kyc.schema";
import { saveVerifiedAccountIdInDb } from "../../utils/kyc";
import { updataKycVerificationStatus } from "../../utils/kyc";
import { createWalletAfterSuccessfulKyc } from "../../utils/kyc";

jest.mock("../../database/client");
jest.mock("../../schemas/kyc.schema", () => ({
  kycSchema: {
    safeParse: jest.fn(),
  },
}));

const mockFile = {
  originalname: "file.jpg",
  buffer: Buffer.from("dummy"),
  mimetype: "image/jpeg",
  fieldname: "photo",
  size: 1234,
  path: "",
  destination: "",
  filename: "file.jpg",
  encoding: "7bit",
  stream: undefined,
};

const mockReq = {
  files: {
    idPhoto: [mockFile],
    selfieWithId: [mockFile],
  },
} as any;

const kyc: KycInput = {
  idType: "passport",
  fullName: "David Tran",
  dateOfBirth: new Date("1990-12-03"),
  idNumber: "P987654321",
  placeOfIssue: "Australia",
  idExpDate: new Date("2029-03-15"),
};

describe("updateKycVerificationStatus", () => {
  it("success", async () => {
    (sql as any as jest.Mock).mockReturnValue({ count: 1 });
    const result = await updataKycVerificationStatus("firebase_id");
    expect(result).toBe(true);
  });
  it("fail, no user found", async () => {
    (sql as any as jest.Mock).mockReturnValue({ count: 0 });
    const result = await updataKycVerificationStatus("firebase_id");
    expect(result).toBe(false);
  });
});

describe("saveVerifiedAccountIdInDb", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("throw error when the account id cannot be found", async () => {
    (sql as any as jest.Mock).mockReturnValue([]);
    try {
      await saveVerifiedAccountIdInDb(kyc, "firebase_id");
    } catch (err: any) {
      expect(err.message).toBe("Account not found for this Firebase ID");
    }
  });

  it("throw error when passport/driver license number misisng", async () => {
    const kycNoIdNum: KycInput = {
      idType: "passport",
      fullName: "David Tran",
      dateOfBirth: new Date("1990-12-03"),
      idNumber: "",
      placeOfIssue: "Australia",
      idExpDate: new Date("2029-03-15"),
    };
    (sql as any as jest.Mock).mockReturnValue(["account_id"]);
    try {
      await saveVerifiedAccountIdInDb(kycNoIdNum, "firebase_id");
    } catch (err: any) {
      expect(err.message).toBe("Missing ID number");
    }
  });

  it("return the saved value when successfully saved", async () => {
    (sql as any as jest.Mock).mockReturnValue(["account_id"]);

    const result = await saveVerifiedAccountIdInDb(kyc, "firebase_id");
    expect(result.length).toBe(1);
    expect(result[0]).toBe("account_id");
  });
});

describe("constructFormData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("If no ID photo given, throw err", () => {
    const mockReqWithoutIdPhoto = {
      ...mockReq,
      files: {
        idPhoto: [],
        selfieWithId: [mockFile],
      },
    };

    try {
      constructKycFormData(mockReqWithoutIdPhoto);
    } catch (err: any) {
      expect(err.message).toEqual("Both the ID and SelfieWithId are required");
    }
  });
  it("If no selfieWithId photo given, throw err", () => {
    const mockReqWithoutIdPhoto = {
      ...mockReq,
      files: {
        idPhoto: [mockFile],
        selfieWithId: [],
      },
    };

    try {
      constructKycFormData(mockReqWithoutIdPhoto);
    } catch (err: any) {
      expect(err.message).toEqual("Both the ID and SelfieWithId are required");
    }
  });
  it("validation failed, throw err", () => {
    (kycSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            path: ["fullName"],
            message: "Required",
            code: "invalid_type",
            expected: "string",
            received: "undefined",
          },
        ],
      },
    });
    try {
      constructKycFormData(mockReq);
    } catch (err: any) {
      expect(err.message).toBe("Validation failed");
      expect(err.details).toEqual(expect.any(Array));
    }
  });
});

describe("isUerKycVerified", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("return true if verified", async () => {
    (sql as any as jest.Mock).mockReturnValue([{ is_verified: true }]);
    const result = await isUserVerified("firebase_id");
    expect(result).toBe(true);
  });
  it("return true if verified", async () => {
    (sql as any as jest.Mock).mockReturnValue([]);
    const result = await isUserVerified("firebase_id");
    expect(result).toBe(false);
  });
});

describe("createWalletAfterSuccessfulKyc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates wallet successfully", async () => {
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ account_id: 1 }]) // user exists
      .mockResolvedValueOnce([{ currency_id: 100 }]) // AUD currency exists
      .mockResolvedValueOnce(1); // insert

    await expect(
      createWalletAfterSuccessfulKyc("test_firebase_id")
    ).resolves.toBeUndefined();

    expect(sql).toHaveBeenCalledTimes(3);
  });

  it("throws error when user not found", async () => {
    (sql as any as jest.Mock).mockResolvedValueOnce([]); // no user

    await expect(
      createWalletAfterSuccessfulKyc("missing_firebase_id")
    ).resolves.toBeUndefined();

    // shuold not continue to next queries
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it("throws error when AUD currency not found", async () => {
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ account_id: 1 }]) // user exists
      .mockResolvedValueOnce([]); // no AUD

    await expect(
      createWalletAfterSuccessfulKyc("test_firebase_id")
    ).resolves.toBeUndefined();

    // should not continue to next queries
    expect(sql).toHaveBeenCalledTimes(2);
  });

  it("logs error when wallet creation fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (sql as any as jest.Mock)
      .mockResolvedValueOnce([{ account_id: 1 }])
      .mockResolvedValueOnce([{ currency_id: 100 }])
      .mockRejectedValueOnce(new Error("INSERT failed"));

    await expect(
      createWalletAfterSuccessfulKyc("test_firebase_id")
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Critical: Failed to create AUD wallet for a verified user:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
