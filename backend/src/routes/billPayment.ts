import { Router } from "express";
import { getUserWallet, getUserTransactions } from "../handlers/dashboard";
import { authenticateFirebaseToken } from "../middleware/auth";
import {
  cancelUpcomingBillById,
  getSavedBillById,
  getUpcomingBills,
  payBill,
  updateBillInfo,
} from "../handlers/billPayment";
import multer from "multer";

const upload = multer();
const router = Router();

// For creating a bill payment, with all the settings
router.post(
  "/bill-payments",
  authenticateFirebaseToken as any,
  upload.none(),
  payBill
);

// TODO: get the bill (maybe in the transition table
//  to display the confirmation of the submission of the pay bill form)
router.get(
  "/bill-payments/bills/:id",
  authenticateFirebaseToken as any,
  getSavedBillById
);

// For getting the upcoming bill payment list
router.get(
  "/bill-payments/upcoming-payments",
  authenticateFirebaseToken as any,
  getUpcomingBills
);

// For getting the available wallets for users
router.get(
  "/bill-payments/wallets",
  authenticateFirebaseToken as any,
  getUserWallet
);

// For editing an upcoming payment
router.put(
  "/bill-payments/upcoming-payments/:id",
  authenticateFirebaseToken as any,
  upload.none(),
  updateBillInfo
);

// For cancel an upcoming payment
router.patch(
  "/bill-payments/upcoming-payments/:id/cancel",
  authenticateFirebaseToken as any,
  cancelUpcomingBillById
);

export default router;
