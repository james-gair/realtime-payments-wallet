import { Router } from "express";
import { createGroup, getGroups } from "../handlers/groupPayments";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.get("/groups", authenticateFirebaseToken as any, getGroups);
router.post("/groups", authenticateFirebaseToken as any, createGroup);

export default router;
