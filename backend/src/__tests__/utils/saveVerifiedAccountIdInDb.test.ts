import sql from "../../database/client";
import { KYCVerifyInput } from "../../dtos/KYCVerifyResponse";
import { saveVerifiedAccountIdInDb } from "../../utils/saveVerifiedAccountIdInDb";

jest.mock("../../database/client");

const kyc: KYCVerifyInput = {
  idType: "passport",
  fullName: "David Tran",
  dateOfBirth: new Date("1990-12-03"),
  passportNumber: "P987654321",
  countryOfIssue: "Australia",
  expiryDate: new Date("2029-03-15"),
};

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
    const kycNoIdNum: KYCVerifyInput = {
      idType: "passport",
      fullName: "David Tran",
      dateOfBirth: new Date("1990-12-03"),
      passportNumber: "",
      countryOfIssue: "Australia",
      expiryDate: new Date("2029-03-15"),
    };
    (sql as any as jest.Mock).mockReturnValue(["account_id"]);
    try {
      await saveVerifiedAccountIdInDb(kyc, "firebase_id");
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
