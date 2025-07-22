import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import {
  cancelUpcomingBillById,
  getAvailableWallets,
  getSavedBillById,
  getUpcomingBills,
  payBill,
  updateBillInfo,
} from "../handlers/billPayment";
import multer from "multer";
import { checkKycStatus } from "../middleware/checkKycStatus";

const upload = multer();
const router = Router();

router.get(
  "/bill-payments/kyc-status",
  authenticateFirebaseToken as any,
  checkKycStatus
);

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
  getAvailableWallets
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
