import axios from "axios";
import { verifyKyc } from "../../services/verifyKyc";
import FormData from "form-data";

jest.mock("axios");
const mockAxiosPost = axios.post as jest.Mock;

const partialFormForMock = new FormData();
partialFormForMock.append("idType", "passport");
partialFormForMock.append("fullName", "Emily Chen");

const mockInputsDetails = {
  idType: "passport",
  fullname: "Emily Chen",
};

describe("testing verifyKyc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`return the verified data if the status 
  code from mock API is 200`, async () => {
    const mockData = {
      ...mockInputsDetails,
      result: "verified",
    };
    mockAxiosPost.mockResolvedValue({
      status: 200,
      data: mockData,
    });
    const result = await verifyKyc(partialFormForMock);
    expect(result).toEqual(mockData);
  });

  it(`return the rejected data 
  if the status code from mock API is 200`, async () => {
    const mockData = {
      ...mockInputsDetails,
      result: "rejected",
    };
    mockAxiosPost.mockResolvedValue({
      status: 200,
      data: mockData,
    });

    const result = await verifyKyc(partialFormForMock);
    expect(result).toEqual(mockData);
  });

  it(`throw error when the mock API 
    sends status code other than 200`, async () => {
    const mockData = {
      ...mockInputsDetails,
      result: "rejected",
    };
    mockAxiosPost.mockRejectedValue({
      status: 400,
      error: "Validation failed",
      issues: "Both passport and selfieWithId photos are required",
    });

    try {
      await verifyKyc(partialFormForMock);
      // should not continue after call
      throw new Error("Expected error was not thrown");
    } catch (err: any) {
      expect(err.error).toEqual("Validation failed");
      expect(err.issues).toEqual(
        "Both passport and selfieWithId photos are required"
      );
    }
  });
});
