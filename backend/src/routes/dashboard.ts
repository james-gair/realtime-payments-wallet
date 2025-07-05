import { Router } from "express";
import { getUser } from "../handlers/dashboard";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/dashboard", authenticateFirebaseToken as any, getUser);

export default router;
