import { RequestHandler, Router} from "express";
import { registerUser,loginUser } from "../handlers/login";
import { authenticateFirebaseToken } from "../middleware/auth"

const router = Router();

// router.post("/register", authenticateFirebaseToken, registerUser);
router.post("/register", authenticateFirebaseToken as any, registerUser);

router.post("/login", loginUser);

export default router;
