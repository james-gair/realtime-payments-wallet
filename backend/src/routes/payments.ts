import { Router } from "express";
import { addMoney, getBankPayInDetails } from "../handlers/payments";
import { authenticateFirebaseToken } from "../middleware/auth";

const paymentsRouter = Router();

paymentsRouter.get(
  "/payments/bank-details",
  authenticateFirebaseToken as any,
  getBankPayInDetails as any
);

paymentsRouter.post(
  "/payments/add-money",
  authenticateFirebaseToken as any,
  addMoney as any
);

export default paymentsRouter;
