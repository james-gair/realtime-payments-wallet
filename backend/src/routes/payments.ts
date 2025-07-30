import { Router } from "express";
import { addMoney } from "../handlers/payments";
import { authenticateFirebaseToken } from "../middleware/auth";

const paymentsRouter = Router();

paymentsRouter.post(
  "/payments/add-money",
  authenticateFirebaseToken as any,
  addMoney as any
);

export default paymentsRouter;
