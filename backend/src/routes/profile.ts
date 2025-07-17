import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import { getUserProfile, updateUserProfile } from "../handlers/profile";

const router = Router();

router.get("/profile", authenticateFirebaseToken as any, getUserProfile);
router.patch("/profile", authenticateFirebaseToken as any, updateUserProfile);

export default router;