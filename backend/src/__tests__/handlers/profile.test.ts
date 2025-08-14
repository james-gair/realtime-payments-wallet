import { getUserProfile, updateUserProfile } from "../../handlers/profile";
import sql from "../../database/client";

jest.mock("../../database/client");

const mockReq = {
  user: {
    uid: "test_firebase_id",
  },
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("getUserProfile", () => {
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    res = createMockRes();
  });

  it("returns 200 and user profile data", async () => {
    const expectedData = {
      account_id: 1,
      email: "test@example.com",
      phone: "+61412345678",
      address: "123 Main St",
    };

    (sql as any as jest.Mock).mockResolvedValueOnce([expectedData]);

    await getUserProfile(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedData);
  });

  it("returns 404 if user is not found", async () => {
    (sql as any as jest.Mock).mockResolvedValueOnce([]);

    await getUserProfile(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 500 on database error", async () => {
    (sql as any as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    await getUserProfile(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch user profile",
    });
  });
});

describe("updateUserProfile", () => {
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    res = createMockRes();
  });

  it("returns 400 if no fields provided", async () => {
    const req = {
      ...mockReq,
      body: {},
    };

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "No fields to update" });
  });

  it("updates email, phone and address successfully", async () => {
    const req = {
      ...mockReq,
      body: {
        email: "new@example.com",
        phone: "+61456789012",
        address: "456 New St",
      },
    };

    const returnedData = {
      account_id: 1,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
    };

    // MOCK sql.unsafe for updateUserProfile
    (sql.unsafe as jest.Mock).mockResolvedValueOnce([returnedData]);

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(returnedData);
  });

  it("returns 404 if update affected no rows", async () => {
    const req = {
      ...mockReq,
      body: { address: "No Match" },
    };

    // MOCK sql.unsafe for updateUserProfile
    (sql.unsafe as jest.Mock).mockResolvedValueOnce([]);

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("returns 500 on SQL failure", async () => {
    const req = {
      ...mockReq,
      body: { address: "error street" },
    };

    // MOCK sql.unsafe for updateUserProfile
    (sql.unsafe as jest.Mock).mockRejectedValueOnce(new Error("DB Failure"));

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to update user profile",
    });
  });
});
