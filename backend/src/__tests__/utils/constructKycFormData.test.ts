import { Request } from "express";
import { kycSchema } from "../../schemas/kyc.schema";
import { constructKycFormData } from "../../utils/constructKycFormData";
import { success } from "zod/v4";

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
    passportPhoto: [mockFile],
    driverLicensePhoto: [mockFile],
    selfieWithId: [mockFile],
  },
} as any;

describe("constructFormData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("If no ID photo given, throw err", () => {
    const mockReqWithoutIdPhoto = {
      ...mockReq,
      files: {
        passportPhoto: [],
        driverLicensePhoto: [],
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
        passportPhoto: [mockFile],
        driverLicensePhoto: [mockFile],
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

  it("missing text field for driver license, return the err", () => {
    (kycSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {
        idType: "drivers_license",
        fullName: "Emily Chen",
        dateOfBirth: "1994-06-15",
        licenseNumber: "NSW1234567",
        stateOfIssue: "NSW",
        // no license expiry date
      },
    });
    try {
      constructKycFormData(mockReq);
    } catch (err: any) {
      expect(err.message).toBe("Missing license details");
    }
  });

  it("missing text field for passport, return the err", () => {
    (kycSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {
        idType: "passport",
        fullName: "David Tran",
        dateOfBirth: "1990-12-03",
        // no passport number
        countryOfIssue: "Australia",
        passportExpiry: "2029-03-15",
      },
    });
    try {
      constructKycFormData(mockReq);
    } catch (err: any) {
      expect(err.message).toBe("Missing passport details");
    }
  });

  it("missing text field, return the err", () => {
    (kycSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {
        idType: "drivers_license",
        fullName: "Emily Chen",
        dateOfBirth: "1994-06-15",
        licenseNumber: "NSW1234567",
        stateOfIssue: "NSW",
        licenseExpiry: "2094-06-15",
      },
    });

    const form = constructKycFormData(mockReq);
    expect(form).toBeDefined();

    const headers = form.getHeaders();
    expect(headers).toHaveProperty("content-type");
  });
});
