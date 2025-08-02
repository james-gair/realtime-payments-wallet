import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import billPaymentsRouter from "./routes/billPayment";
import userDashboard from "./routes/dashboard";
import fxRatesRouter from "./routes/fxRates";
import kycRouter from "./routes/kyc";
import userLogin from "./routes/login";
import paymentsRouter from "./routes/payments";
import profileRouter from "./routes/profile";
import transactionsRouter from "./routes/transactions";
import savedContactsRouter from "./routes/savedContacts";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";
import paymentRequestRouter from "./routes/paymentRequests";

dotenv.config();
export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173" }));
  // Middleware to parse JSON
  app.use(express.json());

  // Swagger setup
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Delete this after starting the actual project
  app.use("/api", userLogin);
  // app.use("/api", userDashboard);
  app.use("/api", billPaymentsRouter);
  app.use("/api", kycRouter);
  app.use("/api", fxRatesRouter);
  app.use("/api", userDashboard);
  app.use("/api", profileRouter);
  app.use("/api/payment-request", paymentRequestRouter);
  app.use("/api", savedContactsRouter);
  app.use("/api", paymentsRouter);
  app.use("/api", transactionsRouter);
  app.use(errorHandler);

  return app;
}
