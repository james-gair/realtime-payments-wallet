import { Router } from "express";
import { kycHandler } from "../handlers/kyc";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.post(
  "/kyc",
  upload.fields([
    { name: "passportPhoto", maxCount: 1 },
    { name: "driverLicensePhoto", maxCount: 1 },
  ]),
  kycHandler
);

export default router;
