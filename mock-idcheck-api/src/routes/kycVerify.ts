import { Router } from "express";
import { kycVerifyHandler } from "../handlers/kycVerify";
import { authenticateToken } from "../middleware/apiKeyValidator";

const router = Router();

router.post("/verify", authenticateToken, kycVerifyHandler);
export default router;
