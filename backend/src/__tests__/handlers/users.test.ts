import { mockRequest, mockResponse } from "../../__mocks__";
import { getTodos } from "../../handlers/todos";

describe("gettodos", () => {
  it("should return an array of users", () => {
    getTodos(mockRequest, mockResponse);
    expect(mockResponse.send).toHaveBeenCalledWith([]);
  });
});
