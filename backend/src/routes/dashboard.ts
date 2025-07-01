import { Router } from "express";
import { getUser } from "../handlers/dashboard";
import { authenticateFirebaseToken} from "../middleware/auth"

const router = Router();

router.get("/dashboard", getUser);

export default router;
