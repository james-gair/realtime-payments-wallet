import { createApp } from "../createApp";
import { Express } from "express";
import request from "supertest";
describe("api/todos", () => {
  let app: Express;
  beforeAll(() => {
    app = createApp();
  });

  it("should return an empty array", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.body).toStrictEqual([]);
  });
});
