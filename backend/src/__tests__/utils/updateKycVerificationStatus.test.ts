import sql from "../../database/client";
import { updataKycVerificationStatus } from "../../utils/updateKycVerificationStatus";

jest.mock("../../database/client");

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
