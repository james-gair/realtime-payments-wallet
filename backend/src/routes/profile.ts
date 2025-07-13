import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import { getUserProfile } from "../handlers/profile";

const router = Router();

router.get("/profile", authenticateFirebaseToken as any, getUserProfile);

export default router;