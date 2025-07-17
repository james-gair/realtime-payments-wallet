import { Router } from "express";
import { getUserWallet, getUserTransactions, postCreateWallet } from "../handlers/dashboard";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/dashboard/wallet", authenticateFirebaseToken as any, getUserWallet);
router.get("/dashboard/transactions", authenticateFirebaseToken as any, getUserTransactions);
router.post("/dashboard/wallet", authenticateFirebaseToken as any, postCreateWallet);
export default router;
