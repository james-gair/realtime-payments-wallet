import express from "express";
import todoRouter from "./routes/todos";
import userRouter from "./routes/users";
import kycRouter from "./routes/kyc";
export function createApp() {
  const app = express();

  // Middleware to parse JSON
  app.use(express.json());

  // Delete this after starting the actual project
  app.use("/api", todoRouter);
  app.use("/api", userRouter);
  app.use("/api", kycRouter);
  return app;
}
