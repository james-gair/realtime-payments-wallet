import { Router } from "express";
import { kycHandler } from "../handlers/kyc";
import upload from "../middleware/uploadMiddleware";
import { authenticateFirebaseToken } from "../middleware/auth";
import { preventDupKyc } from "../middleware/preventDupKyc";

const router = Router();

router.post(
  "/kyc",
  authenticateFirebaseToken as any,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  preventDupKyc,
  kycHandler
);

export default router;
