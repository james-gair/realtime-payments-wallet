import { Router } from "express";
import { kycVerifyHandler } from "../handlers/kycVerify";

const router = Router();

router.post("/verify", kycVerifyHandler);
export default router;
