import { registerUser } from "../../handlers/login";
import sql from "../../database/client";

jest.mock("../../database/client");

const mockReq = {
  body: {
    first_name: "Jane",
    last_name: "Doe",
    phone: "1234567890",
    email: "jane@example.com",
    dob: "1992-05-10",
    username: "janedoe",
  },
  user: {
    uid: "firebase_uid_123",
  },
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("registerUser", () => {
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    res = createMockRes();
  });

  it("inserts user and returns 201 with user data", async () => {
    const mockDbResponse = [{
      account_id: 1,
      firebase_id: "firebase_uid_123",
      username: "janedoe",
      email: "jane@example.com",
      phone: "1234567890",
      date_of_birth: "1992-05-10",
      first_name: "Jane",
      last_name: "Doe",
    }];

    (sql as any as jest.Mock).mockResolvedValueOnce(mockDbResponse);

    await registerUser(mockReq, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      ...mockDbResponse[0],
      message: "User registered successfully",
    });
  });

  it("returns 500 if DB throws an error", async () => {
    (sql as any as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    await registerUser(mockReq, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Failed to add user" });
  });
});
