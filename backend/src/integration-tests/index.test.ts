import { createApp } from "../createApp";
import { Express } from "express";
import request from "supertest";

/**
 * Delete this after starting the actual project
 */
describe("placeholder", () => {
  let app: Express;
  beforeAll(() => {
    app = createApp();
  });

  it("testing", async () => {
    expect(true).toStrictEqual(true);
  });
});
