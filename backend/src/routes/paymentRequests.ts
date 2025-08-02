import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import {
  postPaymentRequest,
  getReceivedPaymentRequests,
  getSentPaymentRequests,
  deletePaymentRequest
} from "../handlers/paymentRequests";

const router = Router();

router.post("/", authenticateFirebaseToken as any, postPaymentRequest);
router.get("/received", authenticateFirebaseToken as any, getReceivedPaymentRequests);
router.get("/sent", authenticateFirebaseToken as any, getSentPaymentRequests);
router.delete("/:id", authenticateFirebaseToken as any, deletePaymentRequest);

export default router;

