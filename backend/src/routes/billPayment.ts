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

// Get the kyc status
router.get(
  "/bill-payments/kyc-status",
  authenticateFirebaseToken as any,
  checkKycStatus
);

/**
 * @swagger
 * /api/bill-payments:
 *   post:
 *     summary: Create a bill payment
 *     description: Create a one-time or recurring, sheduled or non-scheduled bill by filling out the bill form.
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [walletId, amount, payMethod, type, firstPaymentDate]
 *             properties:
 *               walletId:
 *                 type: integer
 *                 description: Wallet to pay from.
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Amount to pay (must be > 0).
 *               payMethod:
 *                 type: string
 *                 enum: [bankAcct, bpay]
 *                 description: Payment method.
 *               billerBsb:
 *                 type: string
 *                 description: Required when payMethod = bankAcct.
 *               billerBankAccountNumber:
 *                 type: string
 *                 description: Required when payMethod = bankAcct.
 *               billerBpayCode:
 *                 type: integer
 *                 description: Required when payMethod = bpay.
 *               billerBpayRef:
 *                 type: string
 *                 description: Required when payMethod = bpay.
 *               billerDisplayName:
 *                 type: string
 *                 description: Optional display name for the biller.
 *               billDisplayName:
 *                 type: string
 *                 description: Optional label for the bill.
 *               type:
 *                 type: string
 *                 enum: [one-time, recurring]
 *                 description: One-time or recurring payment.
 *               frequency:
 *                 type: string
 *                 enum: [weekly, fortnightly, monthly]
 *                 description: Required when type = recurring.
 *               firstPaymentDate:
 *                 type: string
 *                 description: Today triggers immediate payment. By leaving it empty, it pays immediately.
 *               reminder:
 *                 type: boolean
 *                 description: Recieve an Email before the due date.
 *               reminderDays:
 *                 type: integer
 *                 description: Days before due date to remind (used when reminder = true).
 *     responses:
 *       200:
 *         description: Bill payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 billId:
 *                   type: integer
 *       400:
 *         description: Invalid request body or insufficient funds
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post(
  "/bill-payments",
  authenticateFirebaseToken as any,
  upload.none(),
  payBill
);

/**
 * @swagger
 * /api/bill-payments/bills/{id}:
 *   get:
 *     summary: Get saved bill by ID
 *     description: Returns details for a bill owned by the authenticated user.
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bill ID (positive integer)
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Bill found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 walletId:            { type: integer }
 *                 amount:              { type: number }
 *                 payMethod:           { type: string, enum: [bankAcct, bpay] }
 *                 billerBsb:           { type: string,  nullable: true }
 *                 billerBankAccountNumber: { type: string, nullable: true }
 *                 billerBpayCode:      { type: integer, nullable: true }
 *                 billerBpayRef:       { type: string,  nullable: true }
 *                 billerDisplayName:   { type: string,  nullable: true }
 *                 billDisplayName:     { type: string,  nullable: true }
 *                 type:                { type: string, enum: [one-time, recurring] }
 *                 frequency:           { type: string, enum: [weekly, fortnightly, monthly], nullable: true }
 *                 firstPaymentDate:    { type: string, format: date-time }
 *                 reminder:            { type: boolean }
 *                 reminderDays:        { type: integer, nullable: true }
 *                 nextRunAt:           { type: string, format: date-time, nullable: true }
 *                 currencyCode:        { type: string }
 *             examples:
 *               sample:
 *                 value:
 *                   walletId: 3
 *                   amount: 75
 *                   payMethod: bpay
 *                   billerBpayCode: 6666666
 *                   billerBpayRef: "6666666"
 *                   billerDisplayName: "AGL"
 *                   billDisplayName: "Electricity"
 *                   type: recurring
 *                   frequency: monthly
 *                   firstPaymentDate: "2025-12-12"
 *                   reminder: true
 *                   reminderDays: 2
 *                   nextRunAt: "2025-12-12T00:00:00Z"
 *                   currencyCode: "AUD"
 *       400:
 *         description: Invalid bill ID
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Bill not found
 *       500:
 *         description: Server error
 */
router.get(
  "/bill-payments/bills/:id",
  authenticateFirebaseToken as any,
  getSavedBillById
);

// For getting the upcoming bill payment list
/**
 * @swagger
 * /api/bill-payments/upcoming-payments:
 *   get:
 *     summary: Give an authenticated user's upcoming bill payments
 *     description: Returns upcoming, active bill payments for the authenticated user (the bills that are sheduled to be paid after today, exclusive).
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   billId:              { type: integer }
 *                   type:                { type: string, enum: [one-time, recurring] }
 *                   billDisplayName:     { type: string, nullable: true }
 *                   billerDisplayName:   { type: string, nullable: true }
 *                   billerBsb:           { type: string, nullable: true }
 *                   billerBankAccountNumber: { type: string, nullable: true }
 *                   billerBpayCode:      { type: integer, nullable: true }
 *                   billerBpayRef:       { type: string, nullable: true }
 *                   amount:              { type: number }
 *                   nextRunAt:           { type: string, format: date }
 *                   currencyCode:        { type: string }
 *             examples:
 *               sample:
 *                 value:
 *                   - billId: 12
 *                     type: recurring
 *                     billDisplayName: "Electicity"
 *                     billerDisplayName: "AGL"
 *                     billerBpayCode: 6666666
 *                     billerBpayRef: "6666666"
 *                     amount: 75
 *                     nextRunAt: "2025-12-12T00:00:00Z"
 *                     currencyCode: "AUD"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get(
  "/bill-payments/upcoming-payments",
  authenticateFirebaseToken as any,
  getUpcomingBills
);

// For getting the available wallets for users
/**
 * @swagger
 * /api/bill-payments/wallets:
 *   get:
 *     summary: Get wallets available for bill payments
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallets owned by the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   walletId: { type: integer }
 *                   balance:  { type: number }
 *                   currency:  { type: string }
 *             examples:
 *               sample:
 *                 value:
 *                   - walletId: 3
 *                     balance: 1000
 *                     currency: AUD
 *                   - walletId: 2
 *                     balance: 500
 *                     currency: USD
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get(
  "/bill-payments/wallets",
  authenticateFirebaseToken as any,
  getAvailableWallets
);

// For editing an upcoming payment
/**
 * @swagger
 * /api/bill-payments/upcoming-payments/{id}:
 *   put:
 *     summary: Update an existing upcoming bill payment.
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bill ID (positive integer)
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [walletId, amount, payMethod, type, firstPaymentDate]
 *             properties:
 *               walletId:
 *                 type: integer
 *                 description: Wallet to pay from.
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Amount to pay (must be > 0).
 *               payMethod:
 *                 type: string
 *                 enum: [bankAcct, bpay]
 *                 description: Payment method.
 *               billerBsb:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Required when payMethod = bankAcct.
 *               billerBankAccountNumber:
 *                 type: string
 *                 description: Required when payMethod = bankAcct.
 *               billerBpayCode:
 *                 type: integer
 *                 description: Required when payMethod = bpay.
 *               billerBpayRef:
 *                 type: string
 *                 description: Required when payMethod = bpay.
 *               billerDisplayName:
 *                 type: string
 *                 description: Optional display name for the biller.
 *               billDisplayName:
 *                 type: string
 *                 description: Optional label for the bill.
 *               type:
 *                 type: string
 *                 enum: [one-time, recurring]
 *                 description: One-time or recurring payment.
 *               frequency:
 *                 type: string
 *                 enum: [weekly, fortnightly, monthly]
 *                 description: Required when type = recurring.
 *               firstPaymentDate:
 *                 type: string
 *                 description: Today triggers immediate payment. By leaving it empty, it pays immediately.
 *               reminder:
 *                 type: boolean
 *                 description: Recieve an Email before the due date.
 *               reminderDays:
 *                 type: integer
 *                 description: Days before due date to remind (used when reminder = true).
 *     responses:
 *       200:
 *         description: Bill updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 billId: { type: integer }
 *       400:
 *         description: Invalid bill ID or validation failed
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Bill not found or access denied
 *       500:
 *         description: Server error
 */
router.put(
  "/bill-payments/upcoming-payments/:id",
  authenticateFirebaseToken as any,
  upload.none(),
  updateBillInfo
);

// For cancel an upcoming payment
/**
 * @swagger
 * /api/bill-payments/upcoming-payments/{id}/cancel:
 *   delete:
 *     summary: Cancel an existing upcoming bill payment
 *     description: Cancels a future, active bill.
 *     tags: [Bill Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Bill ID (positive integer)
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Bill cancelled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *             example:
 *               message: Bill cancelled successfully.
 *       400:
 *         description: Invalid bill ID or bill cannot be cancelled (already due/non-existent/not active).
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Internal server error.
 */
router.delete(
  "/bill-payments/upcoming-payments/:id/cancel",
  authenticateFirebaseToken as any,
  cancelUpcomingBillById
);

export default router;
