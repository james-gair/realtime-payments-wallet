import { createApp } from "../createApp";
import { Express } from "express";
import request from "supertest";

/**
 * Delete this after starting the actual project
 */
describe("/api/todo", () => {
  let app: Express;
  beforeAll(() => {
    app = createApp();
  });

  it("should return an empty array", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.body).toStrictEqual([]);
  });
});
