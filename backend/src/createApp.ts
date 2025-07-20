import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import userDashboard from "./routes/dashboard";
import fxRatesRouter from "./routes/fxRates";
import kycRouter from "./routes/kyc";
import userLogin from "./routes/login";
import profileRouter from "./routes/profile";

dotenv.config();
export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173" }));
  // Middleware to parse JSON
  app.use(express.json());

  // Delete this after starting the actual project
  app.use("/api", userLogin);
  // app.use("/api", userDashboard);
  app.use("/api", kycRouter);
  app.use(errorHandler);
  app.use("/api", fxRatesRouter);
  app.use("/api", userDashboard);
  app.use("/api", profileRouter);

  return app;
}
