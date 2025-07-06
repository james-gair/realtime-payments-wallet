import { Router } from "express";
import { getUserWallet, getUserTransactions } from "../handlers/dashboard";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/dashboard/wallet", authenticateFirebaseToken as any, getUserWallet);
router.get("/dashboard/transactions", authenticateFirebaseToken as any, getUserTransactions);

export default router;
