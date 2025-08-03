import { Router } from "express";
import { getUserTransactions } from "../handlers/dashboard";
import { getUserCategories } from "../handlers/transactions";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/transactions", authenticateFirebaseToken as any, getUserTransactions);
router.get("/transactions/categories", authenticateFirebaseToken as any, getUserCategories);
router.post("/transactions/:transactionId/categories", authenticateFirebaseToken as any);

export default router;
