import { Router } from "express";
import { getUserWallet, getUserTransactions, postCreateWallet, postExchangeCurrency, postTransferCurrency } from "../handlers/dashboard";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/dashboard/wallet", authenticateFirebaseToken as any, getUserWallet);
router.get("/dashboard/transactions", authenticateFirebaseToken as any, getUserTransactions);
router.post("/dashboard/wallet", authenticateFirebaseToken as any, postCreateWallet);
router.post("/dashboard/exchange", authenticateFirebaseToken as any, postExchangeCurrency);
router.post("/dashboard/transfer", authenticateFirebaseToken as any, postTransferCurrency);
export default router;
