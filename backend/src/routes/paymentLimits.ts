import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import { getPaymentLimits, postPaymentLimits } from "../handlers/paymentLimits";
const router = Router();

/**
 * @swagger
 * /api/payment-limits:
 *   get:
 *     summary: Get the saved monthly spending payment limits for the authenticated user's wallets
 *     tags: [Payment Limits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment limits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       walletId: { type: string }
 *                       currency: { type: string }
 *                       limit:    { type: number, nullable: true }
 *             examples:
 *               sample:
 *                 value:
 *                   limits:
 *                     - walletId: "3"
 *                       limit: 1000
 *                       currency: AUD
 *                     - walletId: "2"
 *                       limit: 500
 *                       currency: USD
 */
router.get(
  "/payment-limits",
  authenticateFirebaseToken as any,
  getPaymentLimits
);

/**
 * @swagger
 * /api/payment-limits:
 *   post:
 *     summary: Set monthly payment limits for the user's wallets
 *     tags: [Payment Limits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [limits]
 *             properties:
 *               limits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [walletId]
 *                   properties:
 *                     walletId:
 *                       type: string
 *                     limit:
 *                       type: number
 *                       nullable: true
 *           examples:
 *             sample:
 *               value:
 *                 limits:
 *                   - walletId: "3"
 *                     limit: 1200
 *                   - walletId: "2"
 *                     limit: null
 *     responses:
 *       200:
 *         description: Limits updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 updated: { type: integer }
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Wallet does not belong to the user or does not exist
 *       500:
 *         description: Internal server error
 */

// For creating a bill payment, with all the settings
router.post(
  "/payment-limits",
  authenticateFirebaseToken as any,
  postPaymentLimits
);

export default router;
