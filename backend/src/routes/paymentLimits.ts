import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import { getPaymentLimits, postPaymentLimits } from "../handlers/paymentLimits";
const router = Router();

router.get(
  "/payment-limits",
  authenticateFirebaseToken as any,
  getPaymentLimits
);

// For creating a bill payment, with all the settings
router.post(
  "/payment-limits",
  authenticateFirebaseToken as any,
  postPaymentLimits
);

export default router;
