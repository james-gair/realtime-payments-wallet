import sql from "../../database/client";
import { isUserVerified } from "../../utils/isUerKycVerified";

jest.mock("../../database/client");

describe("isUerKycVerified", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("return true if verified", async () => {
    (sql as any as jest.Mock).mockReturnValue([{ verified: true }]);
    const result = await isUserVerified("firebase_id");
    expect(result).toBe(true);
  });
  it("return true if verified", async () => {
    (sql as any as jest.Mock).mockReturnValue([]);
    const result = await isUserVerified("firebase_id");
    expect(result).toBe(false);
  });
});
