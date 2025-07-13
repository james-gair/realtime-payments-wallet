import { kycSchema } from "../../schemas/kyc.schema";
import { constructKycFormData } from "../../utils/constructKycFormData";

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
