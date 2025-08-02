import { Router } from "express";
import { getSavedContacts, updateContactNickname } from "../handlers/savedContacts";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.get("/saved-contacts", authenticateFirebaseToken as any, getSavedContacts);
router.patch("/saved-contacts", authenticateFirebaseToken as any, updateContactNickname);

export default router;