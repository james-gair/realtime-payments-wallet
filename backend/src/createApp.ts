import express from "express";
import cors from "cors";
import todoRouter from "./routes/todos";
import userRouter from "./routes/users";
import userLogin from "./routes/login";
import fxRatesRouter from "./routes/fxRates";
import userDashboard from "./routes/dashboard";
import dotenv from "dotenv";

dotenv.config();
export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173" }));
  // Middleware to parse JSON
  app.use(express.json());

  // Delete this after starting the actual project
  app.use("/api", todoRouter);
  app.use("/api", userRouter);
  app.use("/api", userLogin);
  app.use("/api", fxRatesRouter);
  // app.use("/api", userDashboard);

  return app;
}
