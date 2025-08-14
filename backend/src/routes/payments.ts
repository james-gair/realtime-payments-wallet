import { Router } from "express";
import { addMoney } from "../handlers/payments";
import { authenticateFirebaseToken } from "../middleware/auth";
import { checkKycStatus } from "../middleware/checkKycStatus";

const paymentsRouter = Router();

paymentsRouter.post(
  "/payments/add-money",
  authenticateFirebaseToken as any,
  checkKycStatus,
  addMoney as any
);

export default paymentsRouter;
