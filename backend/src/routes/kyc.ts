import { Router } from "express";
import { kycHandler } from "../handlers/kyc";
import upload from "../middleware/uploadMiddleware";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.post(
  "/kyc",
  authenticateFirebaseToken as any,
  upload.fields([
    { name: "passportPhoto", maxCount: 1 },
    { name: "driverLicensePhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  kycHandler
);

export default router;
