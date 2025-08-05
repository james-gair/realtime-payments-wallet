import { Router } from "express";
import { postSendMoney } from "../handlers/sendMoney";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.post("/send-money", authenticateFirebaseToken as any, postSendMoney);

export default router; 