import { mockRequest, mockResponse } from "../../__mocks__";
import { getTodos } from "../../handlers/todos";

/**
 * Delete this after starting the actual project
 */
describe("gettodos", () => {
  it("should return an array of users", () => {
    getTodos(mockRequest, mockResponse);
    expect(mockResponse.send).toHaveBeenCalledWith([]);
  });
});
