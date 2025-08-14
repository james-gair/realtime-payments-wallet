import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { processScheduledJobs } from "./cronJobs/scheduledJobs";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/errorHandler";
import billPaymentsRouter from "./routes/billPayment";
import userDashboard from "./routes/dashboard";
import fxRatesRouter from "./routes/fxRates";
import groupPaymentsRouter from "./routes/groupPayments";
import kycRouter from "./routes/kyc";
import userLogin from "./routes/login";
import paymentLimitsRouter from "./routes/paymentLimits";
import paymentRequestRouter from "./routes/paymentRequests";
import paymentsRouter from "./routes/payments";
import profileRouter from "./routes/profile";
import savedContactsRouter from "./routes/savedContacts";
import sendMoneyRouter from "./routes/sendMoney";
import transactionsRouter from "./routes/transactions";

dotenv.config();
export function createApp() {
  const app = express();

  processScheduledJobs();

  app.use(cors({ origin: "http://localhost:5173" }));
  // Middleware to parse JSON
  app.use(express.json());

  // Swagger setup
  // Read-only docs (no “Try it out”)
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        supportedSubmitMethods: [],
        tryItOutEnabled: false,
      },
    })
  );

  // Delete this after starting the actual project
  app.use("/api", userLogin);
  // app.use("/api", userDashboard);
  app.use("/api", billPaymentsRouter);
  app.use("/api", paymentLimitsRouter);
  app.use("/api", kycRouter);
  app.use("/api", fxRatesRouter);
  app.use("/api", userDashboard);
  app.use("/api", sendMoneyRouter);
  app.use("/api", profileRouter);
  app.use("/api/payment-request", paymentRequestRouter);
  app.use("/api", savedContactsRouter);
  app.use("/api", paymentsRouter);
  app.use("/api", transactionsRouter);
  app.use("/api", groupPaymentsRouter);
  app.use(errorHandler);

  return app;
}
