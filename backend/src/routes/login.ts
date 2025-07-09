import { RequestHandler, Router} from "express";
import { registerUser, loginUser, checkUsername } from "../handlers/login";
import { authenticateFirebaseToken } from "../middleware/auth"

const router = Router();

// router.post("/register", authenticateFirebaseToken, registerUser);
router.post("/register", authenticateFirebaseToken as any, registerUser);

router.post("/login", authenticateFirebaseToken as any, loginUser);

router.get("/check-username", checkUsername);

export default router;
