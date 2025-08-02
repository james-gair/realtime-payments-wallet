import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import {
  postPaymentRequest,
  getReceivedPaymentRequests,
  getSentPaymentRequests
} from "../handlers/paymentRequests";

const router = Router();

router.post("/", authenticateFirebaseToken as any, postPaymentRequest);
router.get("/received", authenticateFirebaseToken as any, getReceivedPaymentRequests);
router.get("/sent", authenticateFirebaseToken as any, getSentPaymentRequests);

export default router;

