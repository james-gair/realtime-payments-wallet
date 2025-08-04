import { Router } from "express";
import { getUserTransactions } from "../handlers/dashboard";
import { getUserCategories, deleteCategory, addCategory } from "../handlers/transactions";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/transactions", authenticateFirebaseToken as any, getUserTransactions);
router.get("/transactions/categories", authenticateFirebaseToken as any, getUserCategories);

router.delete("/transactions/:transactionId/category", authenticateFirebaseToken as any, deleteCategory);
router.put("/transactions/:transactionId/category", authenticateFirebaseToken as any, addCategory);

export default router;
