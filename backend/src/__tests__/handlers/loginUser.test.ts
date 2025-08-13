import { loginUser } from "../../handlers/login";

describe("loginUser", () => {
  it("responds with a login message", async () => {
    // Mock request and response objects
    const req = {};
    const json = jest.fn();
    const res = { json };

    await loginUser(req as any, res as any);

    expect(json).toHaveBeenCalledWith({ message: "login" });
  });
});
