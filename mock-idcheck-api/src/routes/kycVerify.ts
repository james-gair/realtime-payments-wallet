import { Router } from "express";
import { kycVerifyHandler } from "../handlers/kycVerify";
import { authenticateToken } from "../middleware/apiKeyValidator";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.post(
  "/verify",
  authenticateToken,
  upload.single("photo"),
  kycVerifyHandler
);
export default router;
