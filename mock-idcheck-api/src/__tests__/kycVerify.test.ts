import { kycVerifyHandler } from "../handlers/kycVerify";

describe("kycVerifyHandler (unit test)", () => {
  const validPassportInput = {
    idType: "passport",
    fullName: "David Tran",
    dateOfBirth: "1990-12-03",
    passportNumber: "P987654321",
    countryOfIssue: "Australia",
    expiryDate: "2029-03-15",
  };

  const validDriverLicenseInput = {
    idType: "drivers_license",
    fullName: "Emily Chen",
    dateOfBirth: "1994-06-15",
    licenseNumber: "NSW1234567",
    stateOfIssue: "NSW",
    expiryDate: "2026-10-01",
  };

  const validPassportInputButWrongIdInfo = {
    idType: "passport",
    fullName: "David Tran",
    dateOfBirth: "1990-12-05",
    passportNumber: "P987654321",
    countryOfIssue: "Australia",
    expiryDate: "2029-03-15",
  };

  const validDriverLicenseInputButWrongIdInfo = {
    idType: "drivers_license",
    fullName: "Emily Chen",
    dateOfBirth: "1994-06-15",
    licenseNumber: "NSW4234567",
    stateOfIssue: "NSW",
    expiryDate: "2026-10-01",
  };

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

  const createMockReq = (body = {}, files = {}) =>
    ({
      body,
      files,
    } as any);

  const createMockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("should return 400 if ID photo or selfie is missing", () => {
    const req = createMockReq(validPassportInput, {});
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        issues: "Both ID photo and selfie are required",
      })
    );
  });

  it("should return 400 for invalid body", () => {
    const req = createMockReq(
      { fullName: "" }, // Missing required fields
      {
        photo: [mockFile],
        selfieWithId: [mockFile],
      }
    );
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        issues: expect.any(Array),
      })
    );
  });

  it("should return 200 and result for valid passport input but not correct ID info", () => {
    const req = createMockReq(validPassportInputButWrongIdInfo, {
      photo: [mockFile],
      selfieWithId: [mockFile],
    });
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "rejected",
        validatedData: expect.objectContaining({
          fullName: "David Tran",
        }),
      })
    );
  });

  it("should return 200 and result for valid passport input but not correct ID info", () => {
    const req = createMockReq(validDriverLicenseInputButWrongIdInfo, {
      photo: [mockFile],
      selfieWithId: [mockFile],
    });
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "rejected",
        validatedData: expect.objectContaining({
          fullName: "Emily Chen",
        }),
      })
    );
  });

  it("should return 200 and result for valid passport input", () => {
    const req = createMockReq(validPassportInput, {
      photo: [mockFile],
      selfieWithId: [mockFile],
    });
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "verified",
        validatedData: expect.objectContaining({
          fullName: "David Tran",
        }),
      })
    );
  });

  it("should return 200 and result for valid driver license input", () => {
    const req = createMockReq(validDriverLicenseInput, {
      photo: [mockFile],
      selfieWithId: [mockFile],
    });
    const res = createMockRes();

    kycVerifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        result: "verified",
        validatedData: expect.objectContaining({
          fullName: "Emily Chen",
        }),
      })
    );
  });
});
