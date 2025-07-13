import { Router } from "express";
import { kycVerifyHandler } from "../handlers/kycVerify";
import { authenticateToken } from "../middleware/apiKeyValidator";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.post(
  "/verify",
  authenticateToken,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  kycVerifyHandler
);
export default router;
