import { Router } from "express";
import { kycHandler } from "../handlers/kyc";

const router = Router();

router.post("/kyc", kycHandler);

export default router;
