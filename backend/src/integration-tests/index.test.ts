import { createApp } from "../createApp";
import { Express } from "express";

jest.mock("../cronJobs/scheduledJobs", () => ({
  processScheduledJobs: jest.fn(),
}));

describe("placeholder", () => {
  let app: Express;
  beforeAll(() => {
    app = createApp();
  });

  it("testing", async () => {
    expect(true).toStrictEqual(true);
  });
});
