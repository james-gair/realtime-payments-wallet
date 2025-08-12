import { Router } from "express";
import { getUserTransactions } from "../handlers/dashboard";
import { getCategories, deleteCategory, addCategory } from "../handlers/transactions";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/transactions", authenticateFirebaseToken as any, getUserTransactions);

/**
 * @swagger
 * /api/transactions/categories:
 *   get:
 *     summary: Retrive all transaction categories *
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []        
 *     responses:
 *       200:
 *         description: Successfully retrieved all categories.
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Server error.
 */
router.get("/transactions/categories", authenticateFirebaseToken as any, getCategories);

/**
 * @swagger
 * /api/transactions/{transactionId}/category:
 *   delete:
 *     summary: removes category for a transaction *
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []        
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *             properties:
 *               category:
 *                 type: string
 *                 description: The category to remove from the transaction
 *     responses:
 *       200:
 *         description: Successfully deleted category.
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Server error.
 */
router.delete("/transactions/:transactionId/category", authenticateFirebaseToken as any, deleteCategory);

/**
 * @swagger
 * /api/transactions/{transactionId}/category:
 *   put:
 *     summary: adds categories given a transaction id *
 *     tags:
 *       - Transactions
 *     security:
 *       - bearerAuth: []        
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *             properties:
 *               category:
 *                 type: string
 *                 description: The category to add to the transaction
 *     responses:
 *       200:
 *         description: Successfully deleted category.
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Server error.
 */
router.put("/transactions/:transactionId/category", authenticateFirebaseToken as any, addCategory);

export default router;
